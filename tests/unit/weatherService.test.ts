import { afterEach, describe, expect, it, vi } from 'vitest';
import { searchCities, WeatherServiceError } from '../../src/services/weatherService';

const city = {
  id: 3448439,
  name: 'São Paulo',
  admin1: 'São Paulo',
  country: 'Brasil',
  latitude: -23.54756,
  longitude: -46.63614,
};

function mockResponse(payload: unknown, status = 200) {
  return vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation(async () => new Response(JSON.stringify(payload), { status })),
  );
}

afterEach(() => vi.unstubAllGlobals());

describe('searchCities', () => {
  it.each(['', '  ', '\t\n'])('retorna [] para %j sem rede', async (query) => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    expect(await searchCities(query)).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('codifica o nome trimado e mapeia o contrato preservando coordenadas', async () => {
    mockResponse({ results: [city] });
    expect(await searchCities('  São Paulo  ')).toEqual([
      {
        id: '3448439',
        name: 'São Paulo',
        region: 'São Paulo',
        country: 'Brasil',
        latitude: -23.54756,
        longitude: -46.63614,
      },
    ]);
    expect(fetch).toHaveBeenCalledExactlyOnceWith(
      'https://geocoding-api.open-meteo.com/v1/search?name=S%C3%A3o%20Paulo&count=10&language=pt&format=json',
      { method: 'GET', signal: expect.any(AbortSignal) },
    );
  });

  it('codifica caracteres reservados sem criar parâmetros extras', async () => {
    mockResponse({});
    await searchCities('A&B? #+');
    const [url] = vi.mocked(fetch).mock.calls[0];
    expect(new URL(String(url)).searchParams.get('name')).toBe('A&B? #+');
    expect([...new URL(String(url)).searchParams.keys()]).toEqual([
      'name',
      'count',
      'language',
      'format',
    ]);
  });

  it('preserva acentos, apóstrofos e hífens na consulta codificada', async () => {
    mockResponse({ results: [] });
    const query = "L'Haÿ-les-Roses";
    await searchCities(query);
    const [url] = vi.mocked(fetch).mock.calls[0];
    expect(new URL(String(url)).searchParams.get('name')).toBe(query);
  });

  it('mapeia contexto ausente para null e gera id estável quando necessário', async () => {
    mockResponse({ results: [{ name: 'Recife', latitude: -8.05, longitude: -34.9 }] });
    const first = await searchCities('Recife');
    expect(first[0]).toMatchObject({ name: 'Recife', region: null, country: null });
    expect(first[0].id).toBeTruthy();
    expect(await searchCities('Recife')).toEqual(first);
  });

  it('deduplica por contexto e coordenadas, mantendo ordem e no máximo dez cidades', async () => {
    const cities = Array.from({ length: 12 }, (_, index) => ({
      ...city,
      id: index,
      name: `Cidade ${index}`,
    }));
    mockResponse({ results: [cities[0], { ...cities[0], id: 99 }, ...cities.slice(1)] });
    const result = await searchCities('Cidade');
    expect(result).toHaveLength(10);
    expect(result.map((item) => item.name)).toEqual(cities.slice(0, 10).map((item) => item.name));
    expect(result[0].id).toBe('0');
  });

  it.each([{}, { results: [] }])('aceita ausência de resultados %j', async (payload) => {
    mockResponse(payload);
    expect(await searchCities('Recife')).toEqual([]);
  });

  it('lança WeatherServiceError para HTTP não-ok sem tentar novamente', async () => {
    mockResponse({ reason: 'Falha' }, 503);
    await expect(searchCities('Recife')).rejects.toMatchObject({
      name: 'WeatherServiceError',
      status: 503,
    });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it.each([
    null,
    [],
    { error: true },
    { results: null },
    { results: {} },
    { results: [{ name: 'Cidade' }] },
    { results: [{ ...city, latitude: 91 }] },
  ])('rejeita resposta incompatível %j', async (payload) => {
    mockResponse(payload);
    await expect(searchCities('Recife')).rejects.toBeInstanceOf(WeatherServiceError);
  });

  it('identifica rede offline e preserva a causa original', async () => {
    const cause = new TypeError('Falha de rede');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(cause));
    await expect(searchCities('Recife')).rejects.toMatchObject({
      name: 'WeatherServiceError',
      reason: 'network',
      cause,
    });
  });

  it('rejeita JSON inválido', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('invalid')));
    await expect(searchCities('Recife')).rejects.toBeInstanceOf(WeatherServiceError);
  });

  it('conta pontos Unicode e rejeita mais de 100 antes da rede', async () => {
    mockResponse({});
    await expect(searchCities('🌍'.repeat(100))).resolves.toEqual([]);
    vi.mocked(fetch).mockClear();
    await expect(searchCities('🌍'.repeat(101))).rejects.toBeInstanceOf(WeatherServiceError);
    expect(fetch).not.toHaveBeenCalled();
  });
});
