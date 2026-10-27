import { act, cleanup, render, screen, within } from '@testing-library/react';
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
    vi.mocked(searchCities).mockRejectedValueOnce(
      new WeatherServiceError('Falha de rede.', undefined, { reason: 'network' }),
    );
    render(<App />);
    await user.type(screen.getByRole('searchbox'), 'São Paulo{Enter}');
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível concluir a operação. Tente novamente.',
    );
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
    expect(screen.getByRole('heading', { name: 'São Paulo' })).toHaveFocus();
    expect(
      within(screen.getByRole('region', { name: 'Previsão de 5 dias' })).getAllByRole('listitem'),
    ).toHaveLength(5);
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
    expect(screen.getByRole('main')).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('searchbox')).toBeDisabled();
    expect(screen.getByRole('button', { name: '°F', pressed: true })).toBeEnabled();
    expect(screen.queryByRole('region', { name: 'São Paulo' })).not.toBeInTheDocument();
  });

  it('aplica a unidade alterada durante o carregamento a todas as temperaturas resolvidas', async () => {
    const user = userEvent.setup();
    let resolveWeather!: (value: typeof MOCK_WEATHER) => void;
    vi.mocked(getWeather).mockReturnValueOnce(
      new Promise((resolve) => {
        resolveWeather = resolve;
      }),
    );
    render(<App />);
    await user.type(screen.getByRole('searchbox', { name: 'Nome da cidade' }), 'São Paulo{Enter}');
    expect(screen.getByRole('status')).toHaveTextContent('Carregando dados meteorológicos...');

    await user.click(screen.getByRole('button', { name: '°F' }));
    await act(async () => resolveWeather(MOCK_WEATHER));

    const current = within(await screen.findByRole('region', { name: 'São Paulo' }));
    expect(current.getByText('77,7 °F')).toBeInTheDocument();
    expect(current.getByText('Sensação térmica: 79,0 °F')).toBeInTheDocument();
    const forecast = within(screen.getByRole('region', { name: 'Previsão de 5 dias' }));
    expect(forecast.getByText('81,5 °F')).toBeInTheDocument();
    expect(forecast.getByText('64,8 °F')).toBeInTheDocument();
    expect(within(screen.getByRole('main')).queryAllByText(/°C/)).toHaveLength(0);
    expect(getWeather).toHaveBeenCalledTimes(1);
    expect(searchCities).toHaveBeenCalledTimes(1);
  });

  it('não mantém dados anteriores quando uma nova busca falha após um sucesso', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.type(screen.getByRole('searchbox'), 'São Paulo{Enter}');
    await screen.findByRole('region', { name: 'São Paulo' });
    vi.mocked(getWeather).mockRejectedValueOnce(
      new WeatherServiceError('Falha de rede.', undefined, { reason: 'network' }),
    );

    await user.clear(screen.getByRole('searchbox'));
    await user.type(screen.getByRole('searchbox'), 'Recife{Enter}');

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível concluir a operação. Tente novamente.',
    );
    expect(screen.queryByRole('region', { name: 'São Paulo' })).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Previsão de 5 dias' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tentar novamente' })).toBeEnabled();
    expect(getWeather).toHaveBeenCalledTimes(2);
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
    vi.mocked(getWeather).mockRejectedValueOnce(
      new WeatherServiceError('Falha de rede.', undefined, { reason: 'network' }),
    );
    render(<App />);
    await user.click(screen.getByRole('button', { name: '°F' }));
    await user.type(screen.getByRole('searchbox'), 'São Paulo{Enter}');
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível concluir a operação. Tente novamente.',
    );
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(await screen.findByText('77,7 °F')).toBeInTheDocument();
    expect(searchCities).toHaveBeenCalledTimes(2);
    expect(getWeather).toHaveBeenCalledTimes(2);
    expect(screen.getByRole('heading', { name: 'São Paulo' })).toHaveFocus();
  });

  it('permite escolher outro homônimo e distingue coordenadas', async () => {
    const user = userEvent.setup();
    const first = {
      ...MOCK_WEATHER.city,
      id: 'first',
      name: 'Porto Alegre',
      region: 'Rio Grande do Sul',
      latitude: -30.0346,
      longitude: -51.2177,
    };
    const second = { ...first, id: 'second', latitude: -29.6842, longitude: -53.8069 };
    vi.mocked(searchCities).mockResolvedValue([first, second]);
    vi.mocked(getWeather).mockImplementation(async (city) => ({ ...MOCK_WEATHER, city }));

    render(<App />);
    await user.type(screen.getByRole('searchbox'), 'Porto Alegre{Enter}');
    await screen.findByRole('region', { name: 'Porto Alegre' });

    const alternate = screen.getByRole('button', { name: /Porto Alegre.*-29\.6842, -53\.8069/ });
    await user.click(alternate);

    expect(getWeather).toHaveBeenLastCalledWith(second, expect.any(AbortSignal));
    expect(await screen.findByRole('heading', { name: 'Porto Alegre' })).toHaveFocus();
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
