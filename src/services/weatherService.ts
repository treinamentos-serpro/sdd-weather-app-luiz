import { isValidTimezone } from '../lib/format';
import { validateSearch } from '../lib/search';
import { getWeatherCondition } from '../lib/weatherCodes';
import type { City, ForecastDay, WeatherData } from '../types/weather';

export class WeatherServiceError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    options?: ErrorOptions & {
      reason?: 'api' | 'network' | 'timeout' | 'cancelled' | 'validation';
    },
  ) {
    super(message, options);
    this.name = 'WeatherServiceError';
    this.reason = options?.reason ?? 'api';
  }
  readonly reason: 'api' | 'network' | 'timeout' | 'cancelled' | 'validation';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function nullableText(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null;
}

export async function fetchWithTimeout<T>(
  url: string,
  readResponse: (response: Response) => Promise<T>,
  signal?: AbortSignal,
): Promise<T> {
  const controller = new AbortController();
  let timedOut = false;
  const abort = () => controller.abort();
  if (signal?.aborted) abort();
  else signal?.addEventListener('abort', abort, { once: true });
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, 10_000);
  try {
    controller.signal.throwIfAborted();
    let response: Response;
    try {
      response = await fetch(url, { method: 'GET', signal: controller.signal });
    } catch (cause) {
      if (!(cause instanceof TypeError)) throw cause;
      throw new WeatherServiceError('Falha de rede.', undefined, { cause, reason: 'network' });
    }
    return await readResponse(response);
  } catch (cause) {
    if (isRecord(cause) && cause.name === 'AbortError') {
      throw new WeatherServiceError(
        timedOut ? 'A requisição demorou demais.' : 'A requisição foi cancelada.',
        undefined,
        { cause, reason: timedOut ? 'timeout' : 'cancelled' },
      );
    }
    throw cause;
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', abort);
  }
}

async function fetchPayload(url: string, signal?: AbortSignal): Promise<Record<string, unknown>> {
  return fetchWithTimeout(
    url,
    async (response) => {
      if (!response.ok) {
        throw new WeatherServiceError('Não foi possível consultar o provedor.', response.status);
      }
      let payload: unknown;
      try {
        payload = await response.json();
      } catch (cause) {
        if (cause instanceof TypeError) {
          throw new WeatherServiceError('Falha de rede.', response.status, {
            cause,
            reason: 'network',
          });
        }
        if (!(cause instanceof SyntaxError)) throw cause;
        throw new WeatherServiceError('Resposta do provedor inválida.', response.status, { cause });
      }
      if (!isRecord(payload) || payload.error) {
        throw new WeatherServiceError('Resposta do provedor inválida.', response.status);
      }
      return payload;
    },
    signal,
  );
}

function mapCity(value: unknown): City {
  if (
    !isRecord(value) ||
    typeof value.name !== 'string' ||
    !value.name.trim() ||
    typeof value.latitude !== 'number' ||
    !Number.isFinite(value.latitude) ||
    Math.abs(value.latitude) > 90 ||
    typeof value.longitude !== 'number' ||
    !Number.isFinite(value.longitude) ||
    Math.abs(value.longitude) > 180
  ) {
    throw new WeatherServiceError('Resposta de geocodificação inválida.');
  }

  const region = nullableText(value.admin1);
  const country = nullableText(value.country);
  const identity = JSON.stringify([value.name, region, country, value.latitude, value.longitude]);

  return {
    id: typeof value.id === 'number' && Number.isFinite(value.id) ? String(value.id) : identity,
    name: value.name,
    region,
    country,
    latitude: value.latitude,
    longitude: value.longitude,
  };
}

export async function searchCities(name: string, signal?: AbortSignal): Promise<City[]> {
  const query = name.trim();
  if (!query) return [];
  const validationError = validateSearch(query);
  if (validationError) {
    throw new WeatherServiceError(validationError, undefined, { reason: 'validation' });
  }

  const url =
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}` +
    '&count=10&language=pt&format=json';

  const payload = await fetchPayload(url, signal);
  if (payload.results === undefined) return [];
  if (!Array.isArray(payload.results)) {
    throw new WeatherServiceError('Resposta de geocodificação inválida.');
  }

  const cities = payload.results.map(mapCity);
  const seen = new Set<string>();
  return cities
    .filter((city) => {
      const identity = JSON.stringify([
        city.name,
        city.region,
        city.country,
        city.latitude,
        city.longitude,
      ]);
      if (seen.has(identity)) return false;
      seen.add(identity);
      return true;
    })
    .slice(0, 10);
}

function finiteNumber(value: unknown, minimum = -Infinity, maximum = Infinity): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value >= minimum && value <= maximum
    ? value
    : null;
}

function positiveNumber(value: unknown): number | null {
  const number = finiteNumber(value);
  return number !== null && number > 0 ? number : null;
}

function weatherCode(value: unknown): number | null {
  const code = finiteNumber(value);
  return getWeatherCondition(code) ? code : null;
}

function calendarDate(value: unknown): string | null {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
    ? value
    : null;
}

function shiftDate(value: string, days: number): string {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function mapForecast(daily: Record<string, unknown>, currentTime: unknown): ForecastDay[] {
  if (!Array.isArray(daily.time)) {
    throw new WeatherServiceError('Resposta incompleta: datas da previsão ausentes.');
  }
  const dates = daily.time.map(calendarDate);
  const anchorIndex = dates.findIndex((date) => date !== null);
  const anchor = anchorIndex >= 0 ? dates[anchorIndex] : null;
  const start = anchor
    ? shiftDate(anchor, -anchorIndex)
    : calendarDate(typeof currentTime === 'string' ? currentTime.slice(0, 10) : null);
  if (!start) {
    throw new WeatherServiceError('Resposta incompleta: datas da previsão indisponíveis.');
  }
  const valueAt = (field: string, index: number): unknown => {
    const values = daily[field];
    return Array.isArray(values) && index >= 0 ? values[index] : undefined;
  };
  return Array.from({ length: 5 }, (_, offset) => {
    const localDate = shiftDate(start, offset);
    const index = dates.indexOf(localDate);
    return {
      localDate,
      weatherCode: weatherCode(valueAt('weather_code', index)),
      minimumTemperatureC: finiteNumber(valueAt('temperature_2m_min', index)),
      maximumTemperatureC: finiteNumber(valueAt('temperature_2m_max', index)),
      precipitationSumMm: finiteNumber(valueAt('precipitation_sum', index), 0),
      precipitationProbabilityMax: finiteNumber(
        valueAt('precipitation_probability_max', index),
        0,
        100,
      ),
      maximumWindSpeedKmh: finiteNumber(valueAt('wind_speed_10m_max', index), 0),
    };
  });
}

export async function getWeather(city: City, signal?: AbortSignal): Promise<WeatherData> {
  if (
    finiteNumber(city.latitude, -90, 90) === null ||
    finiteNumber(city.longitude, -180, 180) === null
  ) {
    throw new WeatherServiceError('Coordenadas da cidade inválidas.');
  }
  const params = new URLSearchParams({
    latitude: String(city.latitude),
    longitude: String(city.longitude),
    current:
      'temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,surface_pressure',
    daily:
      'weather_code,temperature_2m_min,temperature_2m_max,precipitation_sum,precipitation_probability_max,wind_speed_10m_max',
    timezone: 'auto',
    forecast_days: '5',
    temperature_unit: 'celsius',
    precipitation_unit: 'mm',
    wind_speed_unit: 'kmh',
  });
  const payload = await fetchPayload(`https://api.open-meteo.com/v1/forecast?${params}`, signal);
  if (!isRecord(payload.current) || !isRecord(payload.daily)) {
    throw new WeatherServiceError('Resposta incompleta: condições atuais ou previsão ausentes.');
  }
  const current = payload.current;
  const timezone = nullableText(payload.timezone);
  return {
    city,
    timezone: isValidTimezone(timezone) ? timezone : null,
    current: {
      observedAt: nullableText(current.time),
      weatherCode: weatherCode(current.weather_code),
      temperatureC: finiteNumber(current.temperature_2m),
      apparentTemperatureC: finiteNumber(current.apparent_temperature),
      relativeHumidity: finiteNumber(current.relative_humidity_2m, 0, 100),
      precipitationMm: finiteNumber(current.precipitation, 0),
      windSpeedKmh: finiteNumber(current.wind_speed_10m, 0),
      pressureHpa: positiveNumber(current.surface_pressure),
    },
    forecast: mapForecast(payload.daily, current.time),
  };
}
