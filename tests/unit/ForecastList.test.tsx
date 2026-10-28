import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ForecastCard from '../../src/components/ForecastCard';
import ForecastList from '../../src/components/ForecastList';
import { MOCK_WEATHER } from '../../src/mocks/weather';

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-10-27T12:00:00Z'));
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('ForecastList', () => {
  it('formata fixture de 12 °C e métricas diárias com precisão e unidades exigidas', () => {
    render(
      <ForecastList
        forecast={[
          {
            ...MOCK_WEATHER.forecast[0],
            maximumTemperatureC: 12,
            minimumTemperatureC: 0,
          },
        ]}
        unit="celsius"
        timezone="UTC"
      />,
    );
    for (const value of ['12,0 °C', '0,0 °C', '0,0 mm', '10 %', '18,4 km/h']) {
      expect(screen.getByText(value)).toBeInTheDocument();
    }
  });
  it('preserva cinco dias na ordem e usa o grid responsivo solicitado', () => {
    render(
      <ForecastList
        forecast={MOCK_WEATHER.forecast}
        unit="celsius"
        timezone={MOCK_WEATHER.timezone}
      />,
    );
    expect(screen.getByRole('region', { name: 'Previsão de 5 dias' })).toBeInTheDocument();
    expect(screen.getByRole('list')).toHaveClass('grid-cols-2', 'sm:grid-cols-3', 'lg:grid-cols-5');
    expect(screen.getAllByRole('listitem')).toHaveLength(5);
    expect(screen.getAllByRole('heading', { level: 3 }).map((node) => node.textContent)).toEqual([
      'ter., 27/10',
      'qua., 28/10',
      'qui., 29/10',
      'sex., 30/10',
      'sáb., 31/10',
    ]);
  });

  it('inclui o ano quando a data difere do ano corrente na cidade', () => {
    const forecast = MOCK_WEATHER.forecast.map((day, index) => ({
      ...day,
      localDate: `2027-01-0${index + 1}`,
    }));

    render(<ForecastList forecast={forecast} unit="celsius" timezone="UTC" />);

    expect(screen.getByRole('heading', { name: 'sex., 01/01/2027' })).toBeInTheDocument();
  });

  it('altera máx/mín pela unidade mantendo a probabilidade', () => {
    const { rerender } = render(
      <ForecastCard day={MOCK_WEATHER.forecast[0]} unit="celsius" referenceYear={2026} />,
    );
    expect(screen.getByText('27,5 °C')).toBeInTheDocument();
    expect(screen.getByText('18,2 °C')).toBeInTheDocument();
    expect(screen.getByText('10 %')).toBeInTheDocument();
    expect(screen.getByText('0,0 mm')).toBeInTheDocument();
    expect(screen.getByText('18,4 km/h')).toBeInTheDocument();
    rerender(
      <ForecastCard day={MOCK_WEATHER.forecast[0]} unit="fahrenheit" referenceYear={2026} />,
    );
    expect(screen.getByText('81,5 °F')).toBeInTheDocument();
    expect(screen.getByText('64,8 °F')).toBeInTheDocument();
    expect(screen.getByText('10 %')).toBeInTheDocument();
  });

  it('mantém o dia parcial e mostra os campos indisponíveis', () => {
    render(
      <ForecastList
        forecast={[
          {
            ...MOCK_WEATHER.forecast[0],
            weatherCode: null,
            maximumTemperatureC: null,
            minimumTemperatureC: null,
            precipitationProbabilityMax: null,
            precipitationSumMm: null,
            maximumWindSpeedKmh: null,
          },
        ]}
        unit="celsius"
        timezone="America/Sao_Paulo"
      />,
    );
    const card = screen.getByRole('article', { name: 'ter., 27/10' });
    expect(within(card).getAllByText('Indisponível')).toHaveLength(6);
    expect(screen.getAllByRole('listitem')).toHaveLength(1);
  });

  it.each([null, 'invalid'])('anuncia fuso indisponível %s sem rotular datas', (timezone) => {
    render(<ForecastList forecast={MOCK_WEATHER.forecast} unit="celsius" timezone={timezone} />);
    expect(screen.getByRole('status')).toHaveTextContent(
      'Não foi possível determinar as datas locais.',
    );
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('anuncia a ausência de previsão', () => {
    render(<ForecastList forecast={[]} unit="celsius" timezone="UTC" />);
    expect(screen.getByRole('status')).toHaveTextContent('Dados meteorológicos indisponíveis.');
  });

  it.each(['loading', 'error'] as const)('expõe %s sem mostrar previsão anterior', (status) => {
    render(
      <ForecastList
        forecast={MOCK_WEATHER.forecast}
        unit="celsius"
        timezone="UTC"
        status={status}
      />,
    );
    expect(screen.getByRole(status === 'loading' ? 'status' : 'alert')).toHaveTextContent(
      status === 'loading'
        ? 'Carregando'
        : 'Não foi possível concluir a operação. Tente novamente.',
    );
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('usa ícone decorativo e rótulo textual para a condição', () => {
    render(<ForecastCard day={MOCK_WEATHER.forecast[0]} unit="celsius" referenceYear={2026} />);
    expect(screen.getByText('Parcialmente nublado')).toBeInTheDocument();
    expect(screen.getByText('⛅')).toHaveAttribute('aria-hidden', 'true');
  });
});
