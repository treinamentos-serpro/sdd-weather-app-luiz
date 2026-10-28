import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import CityResults from '../../src/components/CityResults';
import { MOCK_WEATHER } from '../../src/mocks/weather';

afterEach(cleanup);

describe('CityResults', () => {
  const first = { ...MOCK_WEATHER.city, latitude: -23.54756, longitude: -46.63614 };
  const second = { ...first, id: 'second', latitude: -23.12345 };

  it('distingue homônimos com coordenadas somente quando necessárias', () => {
    const onSelect = vi.fn();
    const { rerender } = render(<CityResults cities={[first, second]} onSelect={onSelect} />);
    expect(screen.getByRole('link', { name: 'Open-Meteo' })).toHaveAttribute(
      'href',
      'https://open-meteo.com/',
    );
    expect(screen.getByRole('link', { name: 'GeoNames' })).toHaveAttribute(
      'href',
      'https://www.geonames.org/',
    );
    expect(screen.getByRole('button', { name: /-23.5476, -46.6361/ })).toHaveTextContent(
      'São Paulo, Brasil',
    );
    expect(screen.getByRole('button', { name: /-23.1234, -46.6361/ })).toBeInTheDocument();
    expect(onSelect).not.toHaveBeenCalled();
    rerender(
      <CityResults cities={[first, { ...second, region: 'Outra região' }]} onSelect={onSelect} />,
    );
    expect(screen.getByRole('button', { name: /Outra região, Brasil/ })).not.toHaveTextContent(
      '-23.',
    );
    expect(
      screen.getByRole('button', { name: 'São Paulo São Paulo, Brasil' }),
    ).not.toHaveTextContent('-46.');
  });

  it.each(['{Enter}', ' '])('seleciona uma vez por teclado %s com objeto original', async (key) => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(<CityResults cities={[first, second]} onSelect={onSelect} />);
    screen.getAllByRole('button')[1].focus();
    await user.keyboard(key);
    expect(onSelect).toHaveBeenCalledExactlyOnceWith(second);
  });

  it.each(['loading', 'error', 'empty'] as const)('expõe estado %s sem dados antigos', (status) => {
    render(<CityResults cities={[first]} onSelect={vi.fn()} status={status} />);
    expect(screen.getByRole(status === 'error' ? 'alert' : 'status')).toHaveTextContent(
      status === 'loading'
        ? 'Carregando'
        : status === 'error'
          ? 'Não foi possível concluir a operação. Tente novamente.'
          : 'Nenhuma cidade encontrada. Verifique a busca e tente novamente.',
    );
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });
});
