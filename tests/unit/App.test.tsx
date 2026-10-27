import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../../src/App';
import { MOCK_WEATHER } from '../../src/mocks/weather';
import { getWeather, searchCities, WeatherServiceError } from '../../src/services/weatherService';

vi.mock('../../src/services/weatherService', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../src/services/weatherService')>()),
  searchCities: vi.fn(),
  getWeather: vi.fn(),
}));

beforeEach(() => {
  vi.mocked(searchCities).mockReset().mockResolvedValue([MOCK_WEATHER.city]);
  vi.mocked(getWeather).mockReset().mockResolvedValue(MOCK_WEATHER);
});
afterEach(cleanup);

describe('App integrado ao hook', () => {
  it('não acumula erro de operação e validação nem repete a busca anterior', async () => {
    const user = userEvent.setup();
    vi.mocked(searchCities).mockRejectedValueOnce(new WeatherServiceError('Falha de rede.'));
    render(<App />);
    await user.type(screen.getByRole('searchbox'), 'São Paulo{Enter}');
    expect(await screen.findByRole('alert')).toHaveTextContent('Falha de rede.');
    await user.clear(screen.getByRole('searchbox'));
    await user.click(screen.getByRole('button', { name: 'Buscar' }));
    expect(screen.getAllByRole('alert')).toHaveLength(1);
    expect(screen.getByRole('alert')).toHaveTextContent('Digite o nome de uma cidade.');
    expect(screen.queryByRole('button', { name: 'Tentar novamente' })).not.toBeInTheDocument();
    await user.type(screen.getByRole('searchbox'), 'a'.repeat(101));
    await user.click(screen.getByRole('button', { name: 'Buscar' }));
    expect(screen.getByRole('alert')).toHaveTextContent('A busca deve ter até 100 caracteres.');
    expect(screen.getByRole('searchbox')).toHaveAttribute('aria-invalid', 'true');
    expect(searchCities).toHaveBeenCalledTimes(1);
  });
  it('inicia em idle com Celsius sem rede nem controles de demonstração', () => {
    render(<App />);
    expect(screen.getByText('SDD Weather App')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Consulte o clima' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '°C', pressed: true })).toBeInTheDocument();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(searchCities).not.toHaveBeenCalled();
  });

  it('busca e mostra sucesso, convertendo somente na renderização', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.type(screen.getByRole('searchbox'), 'São Paulo{Enter}');
    expect(await screen.findByRole('region', { name: 'São Paulo' })).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(5);
    await user.click(screen.getByRole('button', { name: '°F' }));
    expect(screen.getByText('77,7 °F')).toBeInTheDocument();
    expect(screen.getByText('81,5 °F')).toBeInTheDocument();
    expect(searchCities).toHaveBeenCalledTimes(1);
    expect(getWeather).toHaveBeenCalledTimes(1);
    expect(MOCK_WEATHER.current.temperatureC).toBe(25.4);
  });

  it('exibe loading e bloqueia busca até finalizar, preservando a unidade', async () => {
    const user = userEvent.setup();
    vi.mocked(searchCities).mockImplementation(() => new Promise(() => {}));
    render(<App />);
    await user.click(screen.getByRole('button', { name: '°F' }));
    await user.type(screen.getByRole('searchbox'), 'Recife{Enter}');
    expect(screen.getByRole('status')).toHaveTextContent('Carregando dados meteorológicos...');
    expect(screen.getByRole('searchbox')).toBeDisabled();
    expect(screen.getByRole('button', { name: '°F', pressed: true })).toBeEnabled();
    expect(screen.queryByRole('region', { name: 'São Paulo' })).not.toBeInTheDocument();
  });

  it('mostra empty sem chamar forecast', async () => {
    const user = userEvent.setup();
    vi.mocked(searchCities).mockResolvedValue([]);
    render(<App />);
    await user.type(screen.getByRole('searchbox'), 'Inexistente{Enter}');
    expect(
      await screen.findByRole('heading', { name: 'Nenhuma cidade encontrada.' }),
    ).toBeInTheDocument();
    expect(getWeather).not.toHaveBeenCalled();
  });

  it('exibe erro real e retry refaz a busca, mantendo unidade e foco', async () => {
    const user = userEvent.setup();
    vi.mocked(getWeather).mockRejectedValueOnce(new WeatherServiceError('Falha de rede.'));
    render(<App />);
    await user.click(screen.getByRole('button', { name: '°F' }));
    await user.type(screen.getByRole('searchbox'), 'São Paulo{Enter}');
    expect(await screen.findByRole('alert')).toHaveTextContent('Falha de rede.');
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(await screen.findByText('77,7 °F')).toBeInTheDocument();
    expect(searchCities).toHaveBeenCalledTimes(2);
    expect(getWeather).toHaveBeenCalledTimes(2);
    expect(screen.getByRole('main')).toHaveFocus();
  });

  it('remove dados anteriores após busca vazia e reinicia a unidade ao remontar', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<App />);
    await user.type(screen.getByRole('searchbox'), 'São Paulo{Enter}');
    await screen.findByRole('region', { name: 'São Paulo' });
    await user.click(screen.getByRole('button', { name: '°F' }));
    vi.mocked(searchCities).mockResolvedValue([]);
    await user.clear(screen.getByRole('searchbox'));
    await user.type(screen.getByRole('searchbox'), 'Inexistente{Enter}');
    await screen.findByRole('heading', { name: 'Nenhuma cidade encontrada.' });
    expect(screen.queryByRole('region', { name: 'São Paulo' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '°F', pressed: true })).toBeInTheDocument();
    unmount();
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Consulte o clima' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '°C', pressed: true })).toBeInTheDocument();
  });
});
