import { useId } from 'react';
import { isValidTimezone } from '../lib/format';
import type { ForecastDay, Unit } from '../types/weather';
import ForecastCard from './ForecastCard';
import ErrorState from './states/ErrorState';
import LoadingState from './states/LoadingState';

interface ForecastListProps {
  forecast: ForecastDay[];
  unit: Unit;
  timezone: string | null;
  status?: 'loading' | 'error' | 'success';
  onRetry?: () => void;
}

export default function ForecastList({
  forecast,
  unit,
  timezone,
  status = 'success',
  onRetry,
}: ForecastListProps) {
  const headingId = useId();
  const referenceYear = isValidTimezone(timezone)
    ? Number(
        new Intl.DateTimeFormat('en-US', { year: 'numeric', timeZone: timezone }).format(
          new Date(),
        ),
      )
    : new Date().getFullYear();

  return (
    <section aria-labelledby={headingId} className="font-sans text-white">
      <h2 id={headingId} className="mb-4 text-xl font-semibold">
        Previsão de 5 dias
      </h2>
      {status === 'loading' ? (
        <LoadingState />
      ) : status === 'error' ? (
        onRetry ? (
          <ErrorState onRetry={onRetry} />
        ) : (
          <p role="alert">Não foi possível concluir a operação. Tente novamente.</p>
        )
      ) : !isValidTimezone(timezone) ? (
        <p role="status">Não foi possível determinar as datas locais.</p>
      ) : forecast.length === 0 ? (
        <p role="status">Dados meteorológicos indisponíveis.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {forecast.map((day) => (
            <li key={day.localDate}>
              <ForecastCard day={day} unit={unit} referenceYear={referenceYear} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
