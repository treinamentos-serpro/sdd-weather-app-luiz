import { useId } from 'react';
import { isValidTimezone } from '../lib/format';
import type { ForecastDay, Unit } from '../types/weather';
import ForecastCard from './ForecastCard';

interface ForecastListProps {
  forecast: ForecastDay[];
  unit: Unit;
  timezone: string | null;
}

export default function ForecastList({ forecast, unit, timezone }: ForecastListProps) {
  const headingId = useId();

  return (
    <section aria-labelledby={headingId} className="font-sans text-white">
      <h2 id={headingId} className="mb-4 text-xl font-semibold">
        Previsão de 5 dias
      </h2>
      {!isValidTimezone(timezone) ? (
        <p role="status">Não foi possível determinar as datas locais.</p>
      ) : forecast.length === 0 ? (
        <p role="status">Dados meteorológicos indisponíveis.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {forecast.map((day) => (
            <li key={day.localDate}>
              <ForecastCard day={day} unit={unit} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
