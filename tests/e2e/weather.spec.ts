import { expect, type Page, test } from '@playwright/test';

async function mockWeatherApi(page: Page) {
  const geocodingRequests: URL[] = [];
  const forecastRequests: URL[] = [];

  await page.route('https://geocoding-api.open-meteo.com/**', async (route) => {
    geocodingRequests.push(new URL(route.request().url()));
    await route.fulfill({
      json: {
        results: [
          {
            id: 3448439,
            name: 'São Paulo',
            admin1: 'São Paulo',
            country: 'Brasil',
            latitude: -23.5475,
            longitude: -46.6361,
          },
        ],
      },
    });
  });
  await page.route('https://api.open-meteo.com/**', async (route) => {
    forecastRequests.push(new URL(route.request().url()));
    await route.fulfill({
      json: {
        timezone: 'America/Sao_Paulo',
        current: {
          time: '2026-10-27T12:00',
          temperature_2m: 12,
          apparent_temperature: 10,
          relative_humidity_2m: 64,
          precipitation: 0,
          weather_code: 2,
          wind_speed_10m: 12.6,
          surface_pressure: 925.4,
        },
        daily: {
          time: ['2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30', '2026-10-31'],
          weather_code: [2, 61, 3, 1, 0],
          temperature_2m_min: [0, 1, 2, 3, 4],
          temperature_2m_max: [15, 16, 17, 18, 19],
          precipitation_sum: [0, 4.2, 0, 0, 0],
          precipitation_probability_max: [10, 80, 20, 5, 0],
          wind_speed_10m_max: [18.4, 22.7, 16.3, 14.8, 15.2],
        },
      },
    });
  });

  return { geocodingRequests, forecastRequests };
}

test('busca uma cidade, exibe cinco dias e converte as temperaturas para Fahrenheit', async ({
  page,
}) => {
  const { geocodingRequests, forecastRequests } = await mockWeatherApi(page);

  await page.goto('/');
  await page.getByRole('searchbox', { name: 'Nome da cidade' }).fill('São Paulo');
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();

  const currentWeather = page.getByRole('region', { name: 'São Paulo', exact: true });
  await expect(currentWeather.getByRole('heading', { name: 'São Paulo', exact: true })).toBeVisible();
  await expect(currentWeather.getByText('27/10/2026 às 12:00')).toBeVisible();
  await expect(currentWeather.getByText('12,0 °C', { exact: true })).toBeVisible();
  await expect(currentWeather.getByText('12,6 km/h', { exact: true })).toBeVisible();

  const forecast = page.getByRole('region', { name: 'Previsão de 5 dias', exact: true });
  await expect(forecast).toBeVisible();
  await expect(forecast.getByRole('listitem')).toHaveCount(5);
  await expect(forecast.getByText('0,0 °C', { exact: true })).toBeVisible();
  expect(geocodingRequests).toHaveLength(1);
  expect(geocodingRequests[0].searchParams.get('name')).toBe('São Paulo');
  expect(forecastRequests).toHaveLength(1);
  expect(forecastRequests[0].searchParams.get('latitude')).toBe('-23.5475');
  expect(forecastRequests[0].searchParams.get('longitude')).toBe('-46.6361');
  expect(forecastRequests[0].searchParams.get('forecast_days')).toBe('5');

  await page.getByRole('button', { name: '°F', exact: true }).click();

  await expect(page.getByRole('button', { name: '°F', pressed: true })).toBeVisible();
  await expect(currentWeather.getByText('53,6 °F', { exact: true })).toBeVisible();
  await expect(currentWeather.getByText('Sensação térmica: 50,0 °F', { exact: true })).toBeVisible();
  await expect(currentWeather.getByText('12,0 °C', { exact: true })).toHaveCount(0);
  await expect(currentWeather.getByText('12,6 km/h', { exact: true })).toBeVisible();
  await expect(forecast.getByText('32,0 °F', { exact: true })).toBeVisible();
  await expect(forecast.getByRole('listitem')).toHaveCount(5);
  expect(geocodingRequests).toHaveLength(1);
  expect(forecastRequests).toHaveLength(1);
});

test('exibe estado vazio quando o geocoding não retorna results', async ({ page }) => {
  const { geocodingRequests, forecastRequests } = await mockWeatherApi(page);
  await page.route('https://geocoding-api.open-meteo.com/**', async (route) => {
    geocodingRequests.push(new URL(route.request().url()));
    await route.fulfill({ json: {} });
  });

  await page.goto('/');
  await page.getByRole('searchbox', { name: 'Nome da cidade' }).fill('Cidade inexistente');
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();

  const status = page.getByRole('status');
  await expect(
    status.getByRole('heading', { name: 'Nenhuma cidade encontrada.', exact: true }),
  ).toBeVisible();
  await expect(
    status.getByText('Verifique a busca e tente novamente.', { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('region', { name: 'Previsão de 5 dias' })).toHaveCount(0);
  await expect(page.getByRole('alert')).toHaveCount(0);
  expect(geocodingRequests).toHaveLength(1);
  expect(forecastRequests).toHaveLength(0);
});

test('bloqueia busca vazia ou só com espaços sem chamar geocoding', async ({ page }) => {
  let geocodingRequests = 0;
  await page.route('https://geocoding-api.open-meteo.com/**', async (route) => {
    geocodingRequests += 1;
    await route.fulfill({ json: { results: [] } });
  });
  await page.goto('/');

  const searchbox = page.getByRole('searchbox', { name: 'Nome da cidade' });
  const submit = page.getByRole('button', { name: 'Buscar', exact: true });
  for (const query of ['', '   ']) {
    await searchbox.fill(query);
    await submit.click();
    await expect(page.getByRole('alert')).toHaveText('Digite o nome de uma cidade.');
    expect(geocodingRequests).toBe(0);
  }
});

test('preserva acentos, apóstrofos, hífens e codifica caracteres reservados', async ({ page }) => {
  const query = "L'Haÿ-les-Roses & São Paulo";
  let requestedName: string | null = null;
  await page.route('https://geocoding-api.open-meteo.com/**', async (route) => {
    requestedName = new URL(route.request().url()).searchParams.get('name');
    await route.fulfill({ json: { results: [] } });
  });
  await page.goto('/');
  await page.getByRole('searchbox', { name: 'Nome da cidade' }).fill(query);
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();

  await expect(page.getByRole('heading', { name: 'Nenhuma cidade encontrada.' })).toBeVisible();
  expect(requestedName).toBe(query);
  await expect(page.getByRole('searchbox')).toHaveValue(query);
});

test('busca e exibe o clima no viewport mobile de 375x812', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await mockWeatherApi(page);

  await page.goto('/');
  await page.getByRole('searchbox', { name: 'Nome da cidade' }).fill('São Paulo');
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();

  const currentWeather = page.getByRole('region', { name: 'São Paulo', exact: true });
  await expect(currentWeather.getByRole('heading', { name: 'São Paulo', exact: true })).toBeVisible();
  await expect(currentWeather.getByText('12,0 °C', { exact: true })).toBeVisible();
  await expect(currentWeather.getByText('Parcialmente nublado', { exact: true })).toBeVisible();

  const forecast = page.getByRole('region', { name: 'Previsão de 5 dias', exact: true });
  await expect(forecast).toBeVisible();
  await expect(forecast.getByRole('listitem')).toHaveCount(5);

  await page.getByRole('button', { name: '°F', exact: true }).click();

  await expect(currentWeather.getByText('53,6 °F', { exact: true })).toBeVisible();
  await expect(forecast.getByText('32,0 °F', { exact: true })).toBeVisible();
  expect(page.viewportSize()).toEqual({ width: 375, height: 812 });
  const dimensions = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
});

for (const stage of ['geocoding', 'forecast'] as const) {
  for (const failure of ['HTTP', 'API'] as const) {
    test(`distingue erro ${failure} de ${stage} de busca vazia e recupera por retry manual`, async ({
      page,
    }) => {
      await mockWeatherApi(page);
      const endpoint =
        stage === 'geocoding'
          ? 'https://geocoding-api.open-meteo.com/**'
          : 'https://api.open-meteo.com/**';
      let failedRequests = 0;
      await page.route(endpoint, async (route) => {
        failedRequests += 1;
        await route.fulfill({
          status: failure === 'HTTP' ? 503 : 200,
          json: { error: true, reason: 'Falha controlada do provedor' },
        });
      });

      await page.goto('/');
      await page.getByRole('searchbox', { name: 'Nome da cidade' }).fill('São Paulo');
      await page.getByRole('button', { name: 'Buscar', exact: true }).click();

      await expect(page.getByRole('alert')).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Nenhuma cidade encontrada.' })).toHaveCount(0);
      await expect(page.getByRole('region', { name: 'São Paulo', exact: true })).toHaveCount(0);
      await expect(page.getByRole('region', { name: 'Previsão de 5 dias' })).toHaveCount(0);
      await expect(page.getByRole('button', { name: 'Tentar novamente' })).toBeVisible();
      expect(failedRequests).toBe(1);

      await page.unroute(endpoint);
      const { geocodingRequests, forecastRequests } = await mockWeatherApi(page);
      await page.getByRole('button', { name: 'Tentar novamente' }).click();

      await expect(page.getByRole('region', { name: 'São Paulo', exact: true })).toBeVisible();
      await expect(page.getByRole('alert')).toHaveCount(0);
      expect(geocodingRequests).toHaveLength(1);
      expect(forecastRequests).toHaveLength(1);
    });
  }
}

test('preserva dados válidos e cinco dias ao receber campos malformados e previsão parcial', async ({
  page,
}) => {
  await mockWeatherApi(page);
  await page.route('https://api.open-meteo.com/**', (route) =>
    route.fulfill({
      json: {
        timezone: 'America/Sao_Paulo',
        current: {
          time: '2026-10-27T12:00',
          temperature_2m: 12,
          apparent_temperature: 'inválido',
          weather_code: 2,
          relative_humidity_2m: 101,
          precipitation: null,
          wind_speed_10m: 12.6,
        },
        daily: {
          time: ['2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30', '2026-10-31'],
          temperature_2m_min: [0],
          temperature_2m_max: [15],
          weather_code: [2],
          precipitation_probability_max: [10],
        },
      },
    }),
  );

  await page.goto('/');
  await page.getByRole('searchbox', { name: 'Nome da cidade' }).fill('São Paulo');
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();

  const current = page.getByRole('region', { name: 'São Paulo', exact: true });
  await expect(current.getByText('12,0 °C', { exact: true })).toBeVisible();
  await expect(current.getByText('12,6 km/h', { exact: true })).toBeVisible();
  await expect(current.getByText('Sensação térmica: Indisponível', { exact: true })).toBeVisible();
  await expect(current.getByText('Indisponível', { exact: true })).toHaveCount(3);
  const days = page.getByRole('region', { name: 'Previsão de 5 dias' }).getByRole('listitem');
  await expect(days).toHaveCount(5);
  await expect(days.first().getByText('15,0 °C', { exact: true })).toBeVisible();
  for (let index = 1; index < 5; index += 1) {
    await expect(days.nth(index).getByText('Indisponível', { exact: true })).toHaveCount(6);
  }

  await page.getByRole('button', { name: '°F', exact: true }).click();

  await expect(current.getByText('53,6 °F', { exact: true })).toBeVisible();
  await expect(days.first().getByText('32,0 °F', { exact: true })).toBeVisible();
  await expect(days.last().getByText('Indisponível', { exact: true })).toHaveCount(6);
  await expect(page.getByRole('alert')).toHaveCount(0);
  await expect(page.locator('body')).not.toContainText(/\b(?:NaN|undefined|null)\b/);
});

test('mostra fallback para campos ausentes em toda a resposta meteorológica', async ({ page }) => {
  await mockWeatherApi(page);
  await page.route('https://api.open-meteo.com/**', (route) =>
    route.fulfill({
      json: {
        timezone: 'America/Sao_Paulo',
        current: {},
        daily: { time: ['2026-10-27'] },
      },
    }),
  );

  await page.goto('/');
  await page.getByRole('searchbox', { name: 'Nome da cidade' }).fill('São Paulo');
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();

  const current = page.getByRole('region', { name: 'São Paulo', exact: true });
  await expect(current.getByRole('status')).toHaveText('Dados meteorológicos indisponíveis.');
  await expect(current.getByText('Indisponível').first()).toBeVisible();
  const days = page.getByRole('region', { name: 'Previsão de 5 dias' }).getByRole('listitem');
  await expect(days).toHaveCount(5);
  for (const day of await days.all()) {
    await expect(day.getByText('Indisponível', { exact: true })).toHaveCount(6);
  }
  await expect(page.locator('body')).not.toContainText(/\b(?:NaN|undefined|null)\b/);
});
