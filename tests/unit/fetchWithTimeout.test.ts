import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  fetchWithTimeout,
  searchCities,
  WeatherServiceError,
} from '../../src/services/weatherService';

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('Timeout de transporte', () => {
  it('propaga cancelamento externo e remove o listener ao concluir', async () => {
    const external = new AbortController();
    const remove = vi.spyOn(external.signal, 'removeEventListener');
    let signal: AbortSignal | null | undefined;
    vi.stubGlobal(
      'fetch',
      vi.fn((_url: string, options: RequestInit) => {
        signal = options.signal;
        return new Promise<Response>((_resolve, reject) => {
          signal?.addEventListener('abort', () =>
            reject(new DOMException('Aborted', 'AbortError')),
          );
        });
      }),
    );
    const request = fetchWithTimeout(
      'https://example.test',
      (response) => response.json(),
      external.signal,
    );
    const rejected = expect(request).rejects.toMatchObject({
      name: 'WeatherServiceError',
      reason: 'cancelled',
      message: 'A requisição foi cancelada.',
    });
    external.abort();
    await rejected;
    expect(signal?.aborted).toBe(true);
    expect(remove).toHaveBeenCalledWith('abort', expect.any(Function));
    expect(vi.getTimerCount()).toBe(0);
  });

  it('aborta exatamente em 10s e limpa o timer no finally', async () => {
    let signal: AbortSignal | undefined;
    vi.stubGlobal(
      'fetch',
      vi.fn((_url: string, options: RequestInit) => {
        signal = options.signal ?? undefined;
        return new Promise<Response>((_resolve, reject) => {
          signal?.addEventListener('abort', () =>
            reject(new DOMException('Aborted', 'AbortError')),
          );
        });
      }),
    );
    const clear = vi.spyOn(globalThis, 'clearTimeout');
    const request = searchCities('Recife');
    const rejection = expect(request).rejects.toMatchObject({
      name: 'WeatherServiceError',
      message: 'A requisição demorou demais.',
      reason: 'timeout',
    });
    await vi.advanceTimersByTimeAsync(9999);
    expect(signal?.aborted).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    await rejection;
    expect(signal?.aborted).toBe(true);
    expect(clear).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('mantém o timeout ativo durante a leitura do corpo', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url: string, options: RequestInit) => ({
        ok: true,
        json: () =>
          new Promise((_resolve, reject) => {
            options.signal?.addEventListener('abort', () =>
              reject(new DOMException('Aborted', 'AbortError')),
            );
          }),
      })),
    );
    const rejection = expect(searchCities('Recife')).rejects.toThrow(
      'A requisição demorou demais.',
    );
    await vi.advanceTimersByTimeAsync(10_000);
    await rejection;
    expect(vi.getTimerCount()).toBe(0);
  });

  it('converte falha de rede e preserva causa', async () => {
    const cause = new TypeError('Failed to fetch');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(cause));
    await expect(searchCities('Recife')).rejects.toMatchObject({
      name: 'WeatherServiceError',
      message: 'Falha de rede.',
      cause,
    });
    expect(vi.getTimerCount()).toBe(0);
  });

  it.each([200, 503])('limpa o timer em resposta HTTP %s', async (status) => {
    const clear = vi.spyOn(globalThis, 'clearTimeout');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status })));
    if (status === 200) await expect(searchCities('Recife')).resolves.toEqual([]);
    else await expect(searchCities('Recife')).rejects.toBeInstanceOf(WeatherServiceError);
    expect(clear).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('mantém erro de JSON distinto de falha de rede e limpa o timer', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('invalid')));
    await expect(searchCities('Recife')).rejects.toThrow('Resposta do provedor inválida.');
    expect(vi.getTimerCount()).toBe(0);
  });

  it('não mascara bugs no callback como falha de rede', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}')));
    const cause = new TypeError('Bug no callback');
    await expect(
      fetchWithTimeout('https://example.test', async () => {
        throw cause;
      }),
    ).rejects.toBe(cause);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('não chama fetch quando o sinal já foi cancelado', async () => {
    const controller = new AbortController();
    controller.abort();
    vi.stubGlobal('fetch', vi.fn());
    await expect(
      fetchWithTimeout('https://example.test', (response) => response.json(), controller.signal),
    ).rejects.toMatchObject({ reason: 'cancelled' });
    expect(fetch).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });
});
