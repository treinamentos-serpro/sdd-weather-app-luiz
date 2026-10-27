import { afterEach, describe, expect, it, vi } from 'vitest';
import { MOCK_WEATHER } from '../../src/mocks/weather';
import { getWeather, WeatherServiceError } from '../../src/services/weatherService';

function fixture() {
  return {
    timezone: 'America/Sao_Paulo',
    current: {
      time: '2026-10-27T12:00',
      weather_code: 2,
      temperature_2m: 25.4,
      apparent_temperature: 26.1,
      relative_humidity_2m: 64,
      precipitation: 0,
      wind_speed_10m: 12.6,
      surface_pressure: 925.4,
    },
    daily: {
      time: ['2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30', '2026-10-31'],
      weather_code: [2, 61, 3, 1, 0],
      temperature_2m_min: [18.2, 19.1, 17.6, 18.4, 19.3],
      temperature_2m_max: [27.5, 25.3, 23.8, 26.7, 28.6],
      precipitation_sum: [0, 4.2, 0, 0, 0],
      precipitation_probability_max: [10, 80, 20, 5, 0],
      wind_speed_10m_max: [18.4, 22.7, 16.3, 14.8, 15.2],
    },
  };
}

function respond(payload: unknown, status = 200) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation(async () => new Response(JSON.stringify(payload), { status })),
  );
}

afterEach(() => vi.unstubAllGlobals());

describe('getWeather', () => {
  it('mapeia current e cinco dias preservando a cidade e unidades canônicas', async () => {
    respond(fixture());
    const data = await getWeather(MOCK_WEATHER.city);
    expect(data).toEqual({
      ...MOCK_WEATHER,
      current: { ...MOCK_WEATHER.current, observedAt: '2026-10-27T12:00' },
    });
    expect(data.city).toBe(MOCK_WEATHER.city);
    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, options] = vi.mocked(fetch).mock.calls[0];
    const params = new URL(String(url)).searchParams;
    expect(options).toEqual({ method: 'GET', signal: expect.any(AbortSignal) });
    expect(params.get('latitude')).toBe(String(MOCK_WEATHER.city.latitude));
    expect(params.get('longitude')).toBe(String(MOCK_WEATHER.city.longitude));
    expect(params.get('current')).toBe(
      'temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,surface_pressure',
    );
    expect(params.get('daily')).toBe(
      'weather_code,temperature_2m_min,temperature_2m_max,precipitation_sum,precipitation_probability_max,wind_speed_10m_max',
    );
    for (const [key, value] of Object.entries({
      timezone: 'auto',
      forecast_days: '5',
      temperature_unit: 'celsius',
      precipitation_unit: 'mm',
      wind_speed_unit: 'kmh',
    }))
      expect(params.get(key)).toBe(value);
  });

  it.each([
    { daily: {} },
    { current: {} },
    { current: null, daily: {} },
    { current: {}, daily: [] },
    { current: {}, daily: {} },
  ])('rejeita resposta incompleta %j', async (payload) => {
    respond(payload);
    await expect(getWeather(MOCK_WEATHER.city)).rejects.toBeInstanceOf(WeatherServiceError);
  });

  it('normaliza campos inválidos e arrays curtos sem remover dias', async () => {
    const payload = fixture();
    payload.current.temperature_2m = Number.NaN;
    payload.current.relative_humidity_2m = 101;
    payload.current.weather_code = 123;
    payload.current.surface_pressure = 0;
    payload.daily.temperature_2m_min = [-10];
    payload.daily.precipitation_probability_max = [-1, 101, 12.5];
    payload.daily.precipitation_sum = [-2];
    respond(payload);
    const data = await getWeather(MOCK_WEATHER.city);
    expect(data.current).toMatchObject({
      temperatureC: null,
      relativeHumidity: null,
      weatherCode: null,
      pressureHpa: null,
      windSpeedKmh: 12.6,
    });
    expect(data.forecast).toHaveLength(5);
    expect(data.forecast[0]).toMatchObject({
      minimumTemperatureC: -10,
      precipitationSumMm: null,
      precipitationProbabilityMax: null,
    });
    expect(data.forecast[1].minimumTemperatureC).toBeNull();
    expect(data.forecast[2].precipitationProbabilityMax).toBe(12.5);
  });

  it('mantém dia sem dados em lacuna do calendário sem deslocar os arrays paralelos', async () => {
    const payload = fixture();
    payload.daily.time.splice(1, 1);
    payload.daily.weather_code.splice(1, 1);
    respond(payload);
    const data = await getWeather(MOCK_WEATHER.city);
    expect(data.forecast[1]).toEqual({
      localDate: '2026-10-28',
      weatherCode: null,
      minimumTemperatureC: null,
      maximumTemperatureC: null,
      precipitationSumMm: null,
      precipitationProbabilityMax: null,
      maximumWindSpeedKmh: null,
    });
    expect(data.forecast[2].weatherCode).toBe(3);
  });

  it('usa a data local de current como âncora quando daily.time está vazio', async () => {
    respond({ timezone: 'invalid', current: fixture().current, daily: { time: [] } });
    const data = await getWeather(MOCK_WEATHER.city);
    expect(data.timezone).toBeNull();
    expect(data.forecast).toHaveLength(5);
    expect(data.forecast[0].localDate).toBe('2026-10-27');
    expect(data.forecast[4].localDate).toBe('2026-10-31');
    expect(data.forecast.every((day) => day.weatherCode === null)).toBe(true);
  });

  it('limita a cinco dias e atravessa mudança de mês e ano sem fuso do dispositivo', async () => {
    const payload = fixture();
    payload.daily.time = [
      '2026-12-30',
      '2026-12-31',
      '2027-01-01',
      '2027-01-02',
      '2027-01-03',
      '2027-01-04',
    ];
    respond(payload);
    const data = await getWeather(MOCK_WEATHER.city);
    expect(data.forecast.map((day) => day.localDate)).toEqual(payload.daily.time.slice(0, 5));
  });

  it.each([400, 503])('rejeita HTTP %s', async (status) => {
    respond({}, status);
    await expect(getWeather(MOCK_WEATHER.city)).rejects.toMatchObject({
      name: 'WeatherServiceError',
      status,
    });
  });
  it('rejeita erro de API e JSON inválido', async () => {
    respond({ error: true, reason: 'Falha' });
    await expect(getWeather(MOCK_WEATHER.city)).rejects.toBeInstanceOf(WeatherServiceError);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('invalid')));
    await expect(getWeather(MOCK_WEATHER.city)).rejects.toBeInstanceOf(WeatherServiceError);
  });
  it('preserva falha de rede como causa sem retry', async () => {
    const cause = new TypeError('Falha de rede');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(cause));
    await expect(getWeather(MOCK_WEATHER.city)).rejects.toMatchObject({
      name: 'WeatherServiceError',
      cause,
    });
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it('rejeita coordenadas inválidas antes da rede', async () => {
    respond({});
    await expect(getWeather({ ...MOCK_WEATHER.city, latitude: 91 })).rejects.toBeInstanceOf(
      WeatherServiceError,
    );
    expect(fetch).not.toHaveBeenCalled();
  });
});
