/// <reference types="node" />
import { execFileSync } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createServer, type Server } from 'node:https';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';
import { MOCK_WEATHER } from '../../src/mocks/weather';

let server: Server;
let temporaryDirectory: string;
let apiOrigin: string;
const receivedRequests = { geocoding: 0, forecast: 0 };

test.beforeAll(async () => {
  temporaryDirectory = await mkdtemp(join(tmpdir(), 'weather-performance-'));
  const key = join(temporaryDirectory, 'key.pem');
  const cert = join(temporaryDirectory, 'cert.pem');
  execFileSync(
    'openssl',
    [
      'req',
      '-x509',
      '-newkey',
      'rsa:2048',
      '-nodes',
      '-keyout',
      key,
      '-out',
      cert,
      '-days',
      '1',
      '-subj',
      '/CN=localhost',
    ],
    { stdio: 'ignore' },
  );
  const { current, forecast } = MOCK_WEATHER;
  const weather = {
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
  };
  server = createServer(
    { key: await readFile(key), cert: await readFile(cert) },
    (request, response) => {
      receivedRequests[request.url?.startsWith('/geocoding') ? 'geocoding' : 'forecast'] += 1;
      const timer = setTimeout(() => {
        response.writeHead(200, {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-store',
        });
        response.end(
          JSON.stringify(
            request.url?.startsWith('/geocoding')
              ? {
                  results: [{ ...MOCK_WEATHER.city, id: 1, admin1: MOCK_WEATHER.city.region }],
                }
              : weather,
          ),
        );
      }, 1000);
      response.on('close', () => clearTimeout(timer));
    },
  );
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Porta HTTPS local indisponível.');
  apiOrigin = `https://127.0.0.1:${address.port}`;
});

test.afterAll(async () => {
  if (server) {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
  if (temporaryDirectory) await rm(temporaryDirectory, { recursive: true, force: true });
});

test('p95 de 100 buscas e 100 seleções com RTT100ms, 10Mbps e API1s', async ({
  page,
  context,
  browser,
}, testInfo) => {
  const network = await context.newCDPSession(page);
  await network.send('Network.enable');
  await network.send('Network.setCacheDisabled', { cacheDisabled: true });
  await network.send('Network.emulateNetworkConditions', {
    offline: false,
    latency: 100,
    downloadThroughput: 10_000_000 / 8,
    uploadThroughput: 10_000_000 / 8,
  });
  await page.route('https://**/*', (route) => {
    const host = new URL(route.request().url()).hostname;
    if (host === 'geocoding-api.open-meteo.com')
      return route.continue({ url: `${apiOrigin}/geocoding` });
    if (host === 'api.open-meteo.com') return route.continue({ url: `${apiOrigin}/forecast` });
    throw new Error(`Requisição externa não prevista: ${host}`);
  });
  await page.addInitScript(() => {
    document.addEventListener(
      'submit',
      () => {
        Reflect.set(window, 'operationStart', performance.now());
      },
      true,
    );
    document.addEventListener(
      'click',
      (event) => {
        if (event.target instanceof Element && event.target.closest('li button')) {
          Reflect.set(window, 'operationStart', performance.now());
        }
      },
      true,
    );
  });
  await page.goto('/');
  const results = page.getByRole('region', { name: 'Resultados da busca' });
  const current = page.getByRole('region', { name: 'São Paulo', exact: true });
  const searches: number[] = [];
  const selections: number[] = [];
  const elapsed = () =>
    page.evaluate(async () => {
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      );
      return performance.now() - Number(Reflect.get(window, 'operationStart'));
    });
  for (let index = 0; index < 100; index += 1) {
    await page.getByRole('searchbox').fill(`São Paulo ${index}`);
    await page.getByRole('button', { name: 'Buscar', exact: true }).click();
    await expect(results.getByRole('button')).toBeVisible();
    searches.push(await elapsed());
    await expect(current).toBeVisible();
  }
  for (let index = 0; index < 100; index += 1) {
    await results.getByRole('button').click();
    await expect(current).toBeVisible();
    await expect(
      page.getByRole('region', { name: 'Previsão de 5 dias' }).getByRole('listitem'),
    ).toHaveCount(5);
    selections.push(await elapsed());
  }
  const p95 = (values: number[]) =>
    [...values].sort((a, b) => a - b)[Math.ceil(values.length * 0.95) - 1];
  const report = {
    browser: browser.version(),
    os: process.platform,
    date: new Date().toISOString(),
    rttMs: 100,
    bandwidthMbps: 10,
    apiLatencyMs: 1000,
    cache: false,
    search: { count: searches.length, p95Ms: p95(searches), samplesMs: searches },
    selection: { count: selections.length, p95Ms: p95(selections), samplesMs: selections },
    receivedRequests,
  };
  const reportPath = testInfo.outputPath('performance-results.json');
  await writeFile(reportPath, JSON.stringify(report, null, 2));
  await testInfo.attach('performance-results.json', {
    path: reportPath,
    contentType: 'application/json',
  });
  console.log(
    JSON.stringify({
      searchP95Ms: report.search.p95Ms,
      selectionP95Ms: report.selection.p95Ms,
      browser: report.browser,
    }),
  );
  expect(searches).toHaveLength(100);
  expect(selections).toHaveLength(100);
  expect(receivedRequests).toEqual({ geocoding: 100, forecast: 200 });
  expect(Math.min(...searches, ...selections)).toBeGreaterThanOrEqual(1000);
  expect(report.search.p95Ms).toBeLessThanOrEqual(5000);
  expect(report.selection.p95Ms).toBeLessThanOrEqual(5000);
});
