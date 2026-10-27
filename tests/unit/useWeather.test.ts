import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useWeather } from '../../src/hooks/useWeather';
import { MOCK_WEATHER } from '../../src/mocks/weather';
import { getWeather, searchCities, WeatherServiceError } from '../../src/services/weatherService';
import type { City, WeatherData } from '../../src/types/weather';

vi.mock('../../src/services/weatherService', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../src/services/weatherService')>()),
  searchCities: vi.fn(),
  getWeather: vi.fn(),
}));

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

beforeEach(() => {
  vi.mocked(searchCities).mockReset().mockResolvedValue([MOCK_WEATHER.city]);
  vi.mocked(getWeather).mockReset().mockResolvedValue(MOCK_WEATHER);
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('useWeather', () => {
  it('não oferece nem executa retry para validação inválida', async () => {
    const { result } = renderHook(() => useWeather());
    await act(() => result.current.search(''));
    expect(result.current.canRetry).toBe(false);
    await act(() => result.current.retry());
    expect(searchCities).not.toHaveBeenCalled();
    act(() => result.current.clearError());
    expect(result.current).toMatchObject({ status: 'idle', error: null, data: null });
  });
  it('inicia em idle e retry sem operação não faz requests', async () => {
    const { result } = renderHook(() => useWeather());
    expect(result.current).toMatchObject({
      status: 'idle',
      data: null,
      cities: [],
      query: '',
      error: null,
    });
    await act(() => result.current.retry());
    expect(searchCities).not.toHaveBeenCalled();
    expect(getWeather).not.toHaveBeenCalled();
  });

  it('busca texto trimado e carrega o primeiro resultado preservando a lista', async () => {
    const other = { ...MOCK_WEATHER.city, id: 'other', name: 'Outra cidade' };
    vi.mocked(searchCities).mockResolvedValue([MOCK_WEATHER.city, other]);
    const { result } = renderHook(() => useWeather());
    await act(() => result.current.search('  São Paulo  '));
    expect(searchCities).toHaveBeenCalledWith('São Paulo', expect.any(AbortSignal));
    expect(getWeather).toHaveBeenCalledWith(MOCK_WEATHER.city, expect.any(AbortSignal));
    expect(result.current).toMatchObject({
      status: 'success',
      data: MOCK_WEATHER,
      cities: [MOCK_WEATHER.city, other],
      query: 'São Paulo',
      error: null,
    });
  });

  it('transita para loading e limpa dados de uma operação anterior', async () => {
    const { result } = renderHook(() => useWeather());
    await act(() => result.current.search('São Paulo'));
    const pending = deferred<City[]>();
    vi.mocked(searchCities).mockReturnValue(pending.promise);
    let request: Promise<void>;
    act(() => {
      request = result.current.search('Recife');
    });
    expect(result.current).toMatchObject({
      status: 'loading',
      data: null,
      error: null,
      cities: [],
    });
    await act(async () => {
      pending.resolve([]);
      await request;
    });
    expect(result.current.status).toBe('empty');
  });

  it('não consulta clima se a lista estiver vazia', async () => {
    vi.mocked(searchCities).mockResolvedValue([]);
    const { result } = renderHook(() => useWeather());
    await act(() => result.current.search('Inexistente'));
    expect(result.current.status).toBe('empty');
    expect(getWeather).not.toHaveBeenCalled();
  });

  it.each(['  ', 'a'.repeat(101)])('valida query inválida sem rede', async (query) => {
    const { result } = renderHook(() => useWeather());
    await act(() => result.current.search(query));
    expect(result.current.status).toBe('error');
    expect(result.current.error).toBe(
      query.trim() ? 'A busca deve ter até 100 caracteres.' : 'Digite o nome de uma cidade.',
    );
    expect(searchCities).not.toHaveBeenCalled();
  });

  it('retry de busca repete geocoding e forecast, preservando cidades em erro de forecast', async () => {
    vi.mocked(getWeather).mockRejectedValueOnce(new WeatherServiceError('Falha de rede.'));
    const { result } = renderHook(() => useWeather());
    await act(() => result.current.search('São Paulo'));
    expect(result.current).toMatchObject({
      status: 'error',
      error: 'Falha de rede.',
      cities: [MOCK_WEATHER.city],
      data: null,
    });
    await act(() => result.current.retry());
    expect(searchCities).toHaveBeenCalledTimes(2);
    expect(getWeather).toHaveBeenCalledTimes(2);
    expect(result.current.status).toBe('success');
  });

  it('selectCity e seu retry consultam somente a cidade escolhida', async () => {
    const other = { ...MOCK_WEATHER.city, id: 'other', name: 'Recife' };
    vi.mocked(getWeather).mockRejectedValueOnce(new WeatherServiceError('Falha de rede.'));
    const { result } = renderHook(() => useWeather());
    await act(() => result.current.selectCity(other));
    expect(result.current.status).toBe('error');
    vi.mocked(getWeather).mockResolvedValue({ ...MOCK_WEATHER, city: other });
    await act(() => result.current.retry());
    expect(searchCities).not.toHaveBeenCalled();
    expect(getWeather).toHaveBeenLastCalledWith(other, expect.any(AbortSignal));
    expect(result.current.data?.city).toEqual(other);
  });

  it('falha de busca não é convertida em empty', async () => {
    vi.mocked(searchCities).mockRejectedValue(new WeatherServiceError('Falha de rede.'));
    const { result } = renderHook(() => useWeather());
    await act(() => result.current.search('Recife'));
    expect(result.current).toMatchObject({ status: 'error', error: 'Falha de rede.', data: null });
  });

  it('cancela e ignora busca antiga concluída fora de ordem', async () => {
    const old = deferred<City[]>();
    vi.mocked(searchCities).mockReturnValueOnce(old.promise).mockResolvedValueOnce([]);
    const { result } = renderHook(() => useWeather());
    let request: Promise<void>;
    act(() => {
      request = result.current.search('Antiga');
    });
    const signal = vi.mocked(searchCities).mock.calls[0][1];
    await act(() => result.current.search('Nova'));
    expect(signal?.aborted).toBe(true);
    await act(async () => {
      old.resolve([MOCK_WEATHER.city]);
      await request;
    });
    expect(result.current).toMatchObject({ status: 'empty', query: 'Nova' });
    expect(getWeather).not.toHaveBeenCalled();
  });

  it('ignora forecast antigo após uma nova seleção', async () => {
    const old = deferred<WeatherData>();
    const other = { ...MOCK_WEATHER.city, id: 'other', name: 'Recife' };
    vi.mocked(getWeather)
      .mockReturnValueOnce(old.promise)
      .mockResolvedValueOnce({ ...MOCK_WEATHER, city: other });
    const { result } = renderHook(() => useWeather());
    let request: Promise<void>;
    act(() => {
      request = result.current.selectCity(MOCK_WEATHER.city);
    });
    await act(() => result.current.selectCity(other));
    await act(async () => {
      old.resolve(MOCK_WEATHER);
      await request;
    });
    expect(result.current.data?.city).toEqual(other);
  });

  it('cancela ao desmontar', async () => {
    const old = deferred<WeatherData>();
    vi.mocked(getWeather).mockReturnValueOnce(old.promise);
    const { result, unmount } = renderHook(() => useWeather());
    let request: Promise<void>;
    act(() => {
      request = result.current.selectCity(MOCK_WEATHER.city);
    });
    const signal = vi.mocked(getWeather).mock.calls[0][1];
    unmount();
    expect(signal?.aborted).toBe(true);
    await act(async () => {
      old.resolve(MOCK_WEATHER);
      await request;
    });
  });

  it('limita toda a operação a 8s, incluindo as duas etapas, sem aceitar sucesso atrasado', async () => {
    vi.useFakeTimers();
    const cities = deferred<City[]>();
    const weather = deferred<WeatherData>();
    vi.mocked(searchCities).mockReturnValue(cities.promise);
    vi.mocked(getWeather).mockReturnValue(weather.promise);
    const { result } = renderHook(() => useWeather());
    let request: Promise<void>;
    act(() => {
      request = result.current.search('São Paulo');
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
      cities.resolve([MOCK_WEATHER.city]);
    });
    await act(() => vi.advanceTimersByTimeAsync(2999));
    expect(result.current.status).toBe('loading');
    await act(() => vi.advanceTimersByTimeAsync(1));
    expect(result.current).toMatchObject({
      status: 'error',
      error: 'A requisição demorou demais.',
      data: null,
    });
    expect(vi.mocked(getWeather).mock.calls[0][1]?.aborted).toBe(true);
    await act(async () => {
      weather.resolve(MOCK_WEATHER);
      await request;
    });
    expect(result.current.status).toBe('error');
    expect(vi.getTimerCount()).toBe(0);
  });
});
