import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import CurrentWeather from '../../src/components/CurrentWeather';
import { getWeatherCondition } from '../../src/lib/weatherCodes';
import { MOCK_WEATHER } from '../../src/mocks/weather';
import type { CurrentWeather as CurrentWeatherData } from '../../src/types/weather';

afterEach(cleanup);

describe('CurrentWeather', () => {
  it('apresenta cidade, condição, temperaturas e métricas em pt-BR', () => {
    const { container } = render(
      <CurrentWeather city={MOCK_WEATHER.city} current={MOCK_WEATHER.current} unit="celsius" />,
    );

    expect(screen.getByRole('region', { name: 'São Paulo' })).toBeInTheDocument();
    for (const text of [
      'São Paulo, Brasil',
      '25,4 °C',
      'Parcialmente nublado',
      'Sensação térmica: 26,1 °C',
      '64 %',
      '12,6 km/h',
      '0,0 mm',
      '925,4 hPa',
    ]) {
      expect(screen.getByText(text)).toBeInTheDocument();
    }
    expect(screen.getAllByRole('term').map((term) => term.textContent)).toEqual([
      'Umidade',
      'Vento',
      'Precipitação',
      'Pressão',
    ]);
    const icon = getWeatherCondition(MOCK_WEATHER.current.weatherCode);
    expect(icon).not.toBeNull();
    if (icon) expect(screen.getByText(icon.icon)).toHaveAttribute('aria-hidden', 'true');
    expect(container.querySelector('time')).toBeNull();
  });

  it('atualiza temperaturas por props sem mudar métricas nem o dado original', () => {
    const { rerender } = render(
      <CurrentWeather city={MOCK_WEATHER.city} current={MOCK_WEATHER.current} unit="celsius" />,
    );
    rerender(
      <CurrentWeather city={MOCK_WEATHER.city} current={MOCK_WEATHER.current} unit="fahrenheit" />,
    );
    expect(screen.getByText('77,7 °F')).toBeInTheDocument();
    expect(screen.getByText('Sensação térmica: 79,0 °F')).toBeInTheDocument();
    expect(screen.getByText('925,4 hPa')).toBeInTheDocument();
    expect(screen.getByText('12,6 km/h')).toBeInTheDocument();
    expect(MOCK_WEATHER.current.temperatureC).toBe(25.4);
  });

  it('preserva os campos válidos em uma resposta parcial', () => {
    render(
      <CurrentWeather
        city={{ ...MOCK_WEATHER.city, region: null, country: null }}
        current={{
          ...MOCK_WEATHER.current,
          weatherCode: 123,
          temperatureC: null,
          relativeHumidity: 101,
          windSpeedKmh: -1,
          precipitationMm: Number.NaN,
          pressureHpa: 0,
        }}
        unit="celsius"
      />,
    );
    expect(screen.getAllByText('Indisponível')).toHaveLength(6);
    expect(screen.getByText('Sensação térmica: 26,1 °C')).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('anuncia quando todos os dados atuais estão indisponíveis', () => {
    const current: CurrentWeatherData = {
      observedAt: null,
      weatherCode: null,
      temperatureC: null,
      apparentTemperatureC: null,
      relativeHumidity: null,
      windSpeedKmh: null,
      precipitationMm: null,
      pressureHpa: null,
    };
    render(<CurrentWeather city={MOCK_WEATHER.city} current={current} unit="celsius" />);
    expect(screen.getByRole('status')).toHaveTextContent('Dados meteorológicos indisponíveis.');
    expect(screen.getAllByRole('definition')).toHaveLength(4);
    expect(screen.getByRole('heading', { name: 'São Paulo' })).toBeInTheDocument();
  });

  it('rejeita pressão negativa e infinita', () => {
    const { rerender } = render(
      <CurrentWeather
        city={MOCK_WEATHER.city}
        current={{ ...MOCK_WEATHER.current, pressureHpa: -10 }}
        unit="celsius"
      />,
    );
    expect(screen.getByText('Indisponível')).toBeInTheDocument();
    rerender(
      <CurrentWeather
        city={MOCK_WEATHER.city}
        current={{ ...MOCK_WEATHER.current, pressureHpa: Infinity }}
        unit="celsius"
      />,
    );
    expect(screen.getByText('Indisponível')).toBeInTheDocument();
  });
});
