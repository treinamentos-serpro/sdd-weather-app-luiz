import { useId } from 'react';
import { formatDayLabel, formatProbability } from '../lib/format';
import { formatTemperature } from '../lib/temperature';
import { getWeatherCondition } from '../lib/weatherCodes';
import type { ForecastDay, Unit } from '../types/weather';

interface ForecastCardProps {
  day: ForecastDay;
  unit: Unit;
}

export default function ForecastCard({ day, unit }: ForecastCardProps) {
  const headingId = useId();
  const label = formatDayLabel(day.localDate);
  const condition = getWeatherCondition(day.weatherCode);

  return (
    <article
      aria-labelledby={headingId}
      className="h-full min-w-0 break-words rounded-2xl border border-white/10 bg-white/5 p-4 font-sans text-white shadow-glass backdrop-blur-md"
    >
      <h3 id={headingId} className="font-semibold">
        {label === 'Indisponível' ? label : <time dateTime={day.localDate}>{label}</time>}
      </h3>
      {condition && (
        <span aria-hidden="true" className="my-4 block text-4xl text-sun">
          {condition.icon}
        </span>
      )}
      <p className="my-3 text-sm text-slate-300">{condition?.label ?? 'Indisponível'}</p>
      <dl className="space-y-3">
        <div>
          <dt className="text-sm text-slate-300">Máxima</dt>
          <dd className="font-semibold">{formatTemperature(day.maximumTemperatureC, unit)}</dd>
        </div>
        <div>
          <dt className="text-sm text-slate-300">Mínima</dt>
          <dd>{formatTemperature(day.minimumTemperatureC, unit)}</dd>
        </div>
        <div>
          <dt className="text-sm text-slate-300">Probabilidade de chuva</dt>
          <dd>{formatProbability(day.precipitationProbabilityMax)}</dd>
        </div>
      </dl>
    </article>
  );
}
