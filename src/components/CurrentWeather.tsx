import { useId } from 'react';
import { formatTemperature } from '../lib/temperature';
import { getWeatherCondition } from '../lib/weatherCodes';
import type { City, CurrentWeather as CurrentWeatherData, Unit } from '../types/weather';

interface CurrentWeatherProps {
  city: City;
  current: CurrentWeatherData;
  unit: Unit;
}

function formatMetric(value: number | null, suffix: string, maximum = Infinity): string {
  if (value === null || !Number.isFinite(value) || value < 0 || value > maximum) {
    return 'Indisponível';
  }
  const digits = suffix === '%' ? 0 : 1;
  return `${new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value)} ${suffix}`;
}

export default function CurrentWeather({ city, current, unit }: CurrentWeatherProps) {
  const headingId = useId();
  const condition = getWeatherCondition(current.weatherCode);
  const temperature = formatTemperature(current.temperatureC, unit);
  const apparentTemperature = formatTemperature(current.apparentTemperatureC, unit);
  const metrics = [
    { label: 'Umidade', value: formatMetric(current.relativeHumidity, '%', 100) },
    { label: 'Vento', value: formatMetric(current.windSpeedKmh, 'km/h') },
    { label: 'Precipitação', value: formatMetric(current.precipitationMm, 'mm') },
    {
      label: 'Pressão',
      value: formatMetric(current.pressureHpa === 0 ? null : current.pressureHpa, 'hPa'),
    },
  ];
  const unavailable =
    !condition &&
    temperature === 'Indisponível' &&
    apparentTemperature === 'Indisponível' &&
    metrics.every((metric) => metric.value === 'Indisponível');

  return (
    <section
      aria-labelledby={headingId}
      className="break-words rounded-3xl border border-white/10 bg-white/5 p-6 font-sans text-white shadow-glass backdrop-blur-md sm:p-8"
    >
      <header>
        <p className="text-sm text-slate-300">Condições atuais</p>
        <h2 id={headingId} className="mt-1 text-2xl font-semibold sm:text-3xl">
          {city.name}
        </h2>
        <p className="mt-1 text-sm text-slate-300">
          {[city.region, city.country].filter(Boolean).join(', ')}
        </p>
      </header>
      {unavailable && <p role="status">Dados meteorológicos indisponíveis.</p>}
      <div className="my-8 flex flex-wrap items-center gap-6">
        {condition && (
          <span aria-hidden="true" className="text-6xl text-sun sm:text-7xl">
            {condition.icon}
          </span>
        )}
        <div className="min-w-0 max-w-full">
          <p className="text-sm text-slate-300">Temperatura</p>
          <p
            className={
              temperature === 'Indisponível'
                ? 'text-2xl font-semibold'
                : 'text-6xl font-semibold tracking-tight sm:text-8xl'
            }
          >
            {temperature}
          </p>
          <p className="mt-2 text-lg">{condition?.label ?? 'Indisponível'}</p>
          <p className="mt-1 text-sm text-slate-300">Sensação térmica: {apparentTemperature}</p>
        </div>
      </div>
      <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded-xl border border-white/10 bg-white/5 p-3">
            <dt className="text-sm text-slate-300">{metric.label}</dt>
            <dd className="mt-1 font-semibold">{metric.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
