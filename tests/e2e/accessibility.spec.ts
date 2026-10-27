import { expect, test } from '@playwright/test';
import { MOCK_WEATHER } from '../../src/mocks/weather';

test.beforeEach(async ({ page }) => {
  await page.route('https://geocoding-api.open-meteo.com/**', async (route) => {
    const query = new URL(route.request().url()).searchParams.get('name');
    if (query === 'loading') return;
    if (query === 'error') {
      await route.fulfill({ status: 503, json: {} });
      return;
    }
    await route.fulfill({
      json: {
        results:
          query === 'empty'
            ? []
            : [
                {
                  ...MOCK_WEATHER.city,
                  admin1: MOCK_WEATHER.city.region,
                },
              ],
      },
    });
  });
  await page.route('https://api.open-meteo.com/**', async (route) => {
    const { current, forecast } = MOCK_WEATHER;
    await route.fulfill({
      json: {
        timezone: MOCK_WEATHER.timezone,
        current: {
          time: current.observedAt,
          weather_code: current.weatherCode,
          temperature_2m: current.temperatureC,
          apparent_temperature: current.apparentTemperatureC,
          relative_humidity_2m: current.relativeHumidity,
          precipitation: current.precipitationMm,
          wind_speed_10m: current.windSpeedKmh,
          surface_pressure: current.pressureHpa,
        },
        daily: {
          time: forecast.map((day) => day.localDate),
          weather_code: forecast.map((day) => day.weatherCode),
          temperature_2m_min: forecast.map((day) => day.minimumTemperatureC),
          temperature_2m_max: forecast.map((day) => day.maximumTemperatureC),
          precipitation_sum: forecast.map((day) => day.precipitationSumMm),
          precipitation_probability_max: forecast.map((day) => day.precipitationProbabilityMax),
          wind_speed_10m_max: forecast.map((day) => day.maximumWindSpeedKmh),
        },
      },
    });
  });
});

test('mantém conteúdo sem cortes de 320px a desktop em todos os estados', async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto('/');
  for (const [width, height] of [
    [320, 900],
    [375, 900],
    [640, 900],
    [768, 900],
    [844, 390],
    [1024, 900],
    [1440, 900],
  ]) {
    await page.setViewportSize({ width, height });
    for (const state of ['idle', 'loading', 'empty', 'error', 'success']) {
      await page.goto('/');
      if (state !== 'idle') {
        await page.getByRole('searchbox').fill(state);
        await page.getByRole('button', { name: 'Buscar' }).click();
      }
      if (state === 'loading') await expect(page.getByRole('status')).toContainText('Carregando');
      if (state === 'empty') await expect(page.getByRole('status')).toContainText('Nenhuma cidade');
      if (state === 'error') await expect(page.getByRole('alert')).toBeVisible();
      if (state === 'success') {
        await expect(page.getByRole('region', { name: 'São Paulo' })).toBeVisible();
        await page.getByRole('button', { name: '°F' }).focus();
        await page.keyboard.press('Space');
        await expect(
          page.getByRole('region', { name: 'Previsão de 5 dias' }).getByRole('listitem'),
        ).toHaveCount(5);
      }
      const overflowing = await page
        .locator('body')
        .evaluate((body) =>
          [body, ...body.querySelectorAll('main *')]
            .filter(
              (element) => element.clientWidth > 0 && element.scrollWidth > element.clientWidth + 1,
            )
            .map((element) => `${element.tagName}: ${element.textContent?.slice(0, 60)}`),
        );
      expect(overflowing, `${width}px / ${state}`).toEqual([]);
    }
  }
});

test('skip link, busca, unidade e retry funcionam por teclado com foco preservado', async ({
  page,
}) => {
  test.skip(
    test.info().project.name === 'mobile',
    'A emulação mobile não modela navegação com teclado físico.',
  );
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Pular para o conteúdo' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('main')).toBeFocused();

  await page.getByRole('searchbox').focus();
  await page.keyboard.type('Sao Paulo');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('region', { name: 'São Paulo' })).toBeVisible();
  await page.getByRole('button', { name: '°F' }).focus();
  await page.keyboard.press('Space');
  await expect(page.getByRole('button', { name: '°F' })).toHaveAttribute('aria-pressed', 'true');
  const outline = await page.getByRole('button', { name: '°F' }).evaluate((element) => {
    const style = getComputedStyle(element);
    return { width: style.outlineWidth, style: style.outlineStyle };
  });
  expect(outline.style).not.toBe('none');
  expect(parseFloat(outline.width)).toBeGreaterThanOrEqual(2);
  await page.getByRole('searchbox').fill('error');
  await page.getByRole('button', { name: 'Buscar' }).click();
  await expect(page.getByRole('alert')).toBeVisible();
  await page.route('https://geocoding-api.open-meteo.com/**', (route) =>
    route.fulfill({
      json: { results: [{ ...MOCK_WEATHER.city, admin1: MOCK_WEATHER.city.region }] },
    }),
  );
  await page.getByRole('button', { name: 'Tentar novamente' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'São Paulo' })).toBeFocused();
});

test('bordas, foco e textos dos controles atingem contraste AA', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('searchbox')).toBeVisible();
  const ratios = await page.evaluate(() => {
    function rgb(value: string) {
      return (value.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
    }
    function luminance(color: number[]) {
      return color
        .map((value) => {
          const channel = value / 255;
          return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
        })
        .reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
    }
    function contrast(a: string, b: string) {
      const first = luminance(rgb(a));
      const second = luminance(rgb(b));
      return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
    }
    return [...document.querySelectorAll('input, select, button')]
      .map((element) => {
        const style = getComputedStyle(element);
        const background = style.backgroundColor;
        return {
          control: element.tagName,
          border: contrast(style.borderColor, background),
          text: contrast(style.color, background),
          opaque: rgb(background).length === 3 && !background.includes('rgba'),
        };
      })
      .filter((result) => result.opaque);
  });
  expect(ratios.length).toBeGreaterThanOrEqual(2);
  for (const result of ratios) {
    expect(result.text, `${result.control} texto`).toBeGreaterThanOrEqual(4.5);
    if (result.control !== 'BUTTON') {
      expect(result.border, `${result.control} borda`).toBeGreaterThanOrEqual(3);
    }
  }
});
