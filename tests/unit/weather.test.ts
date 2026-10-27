import { describe, expect, expectTypeOf, it } from 'vitest';
import { MOCK_WEATHER } from '../../src/mocks/weather';
import type {
  CurrentWeather,
  ForecastDay,
  TemperatureUnit,
  Unit,
  WeatherData,
  WeatherSnapshot,
} from '../../src/types/weather';

describe('Contratos meteorológicos', () => {
  it('mantém os nomes solicitados compatíveis com o plano', () => {
    expectTypeOf<Unit>().toEqualTypeOf<'celsius' | 'fahrenheit'>();
    expectTypeOf<TemperatureUnit>().toEqualTypeOf<Unit>();
    expectTypeOf<WeatherSnapshot>().toEqualTypeOf<WeatherData>();
    expectTypeOf(MOCK_WEATHER).toEqualTypeOf<WeatherData>();
  });

  it('permite representar dados meteorológicos indisponíveis', () => {
    const current: CurrentWeather = {
      observedAt: null,
      weatherCode: null,
      temperatureC: null,
      apparentTemperatureC: null,
      relativeHumidity: null,
      precipitationMm: null,
      windSpeedKmh: null,
      pressureHpa: null,
    };
    const day: ForecastDay = {
      localDate: '2026-10-27',
      weatherCode: null,
      minimumTemperatureC: null,
      maximumTemperatureC: null,
      precipitationSumMm: null,
      precipitationProbabilityMax: null,
      maximumWindSpeedKmh: null,
    };
    const partial: WeatherData = {
      city: { ...MOCK_WEATHER.city, region: null, country: null },
      timezone: null,
      current,
      forecast: [day],
    };

    expect(partial.current.temperatureC).toBeNull();
    expect(partial.forecast[0].maximumTemperatureC).toBeNull();
  });
});

describe('Mock meteorológico', () => {
  it('fornece cinco datas consecutivas a partir da data local do dado atual', () => {
    expect(MOCK_WEATHER.timezone).toBe('America/Sao_Paulo');
    expect(MOCK_WEATHER.current.observedAt).toBe('2026-10-27T12:00:00-03:00');
    expect(MOCK_WEATHER.forecast.map((day) => day.localDate)).toEqual([
      '2026-10-27',
      '2026-10-28',
      '2026-10-29',
      '2026-10-30',
      '2026-10-31',
    ]);
  });

  it('fornece condições atuais completas e valores válidos para desenvolver a UI', () => {
    for (const value of Object.values(MOCK_WEATHER.current)) {
      expect(value).not.toBeNull();
      if (typeof value === 'number') {
        expect(Number.isFinite(value)).toBe(true);
      }
    }

    expect(MOCK_WEATHER.current.relativeHumidity).toBeGreaterThanOrEqual(0);
    expect(MOCK_WEATHER.current.relativeHumidity).toBeLessThanOrEqual(100);
    expect(MOCK_WEATHER.current.precipitationMm).toBeGreaterThanOrEqual(0);
    expect(MOCK_WEATHER.current.windSpeedKmh).toBeGreaterThanOrEqual(0);
    expect(MOCK_WEATHER.current.pressureHpa).toBeGreaterThan(0);

    for (const day of MOCK_WEATHER.forecast) {
      for (const value of Object.values(day)) {
        expect(value).not.toBeNull();
        if (typeof value === 'number') {
          expect(Number.isFinite(value)).toBe(true);
        }
      }

      if (typeof day.maximumTemperatureC === 'number') {
        expect(day.minimumTemperatureC).toBeLessThanOrEqual(day.maximumTemperatureC);
      }
      expect(day.precipitationSumMm).toBeGreaterThanOrEqual(0);
      expect(day.precipitationProbabilityMax).toBeGreaterThanOrEqual(0);
      expect(day.precipitationProbabilityMax).toBeLessThanOrEqual(100);
      expect(day.maximumWindSpeedKmh).toBeGreaterThanOrEqual(0);
      expect([0, 1, 2, 3, 61]).toContain(day.weatherCode);
    }
  });
});
