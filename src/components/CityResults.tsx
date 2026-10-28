import { useId } from 'react';
import type { City } from '../types/weather';
import EmptyState from './states/EmptyState';
import ErrorState from './states/ErrorState';
import LoadingState from './states/LoadingState';

interface CityResultsProps {
  cities: City[];
  onSelect: (city: City) => void;
  status?: 'loading' | 'error' | 'empty' | 'success';
  onRetry?: () => void;
}

function regionalIdentity(city: City): string {
  return JSON.stringify([city.name, city.region, city.country]);
}

function contextLabel(city: City, showCoordinates: boolean): string {
  const region = [city.region, city.country].filter(Boolean).join(', ');
  if (!showCoordinates) return region;

  const coordinates = `${city.latitude.toFixed(4)}, ${city.longitude.toFixed(4)}`;
  return region ? `${region} · ${coordinates}` : coordinates;
}

export default function CityResults({
  cities,
  onSelect,
  status = 'success',
  onRetry,
}: CityResultsProps) {
  const headingId = useId();
  const identities = new Map<string, number>();
  for (const city of cities) {
    const identity = regionalIdentity(city);
    identities.set(identity, (identities.get(identity) ?? 0) + 1);
  }

  return (
    <section aria-labelledby={headingId} className="font-sans text-white">
      <h2 id={headingId} className="mb-3 text-lg font-semibold">
        Resultados da busca
      </h2>
      <p className="mb-3 text-sm text-slate-300">
        Geocodificação:{' '}
        <a
          href="https://open-meteo.com/"
          className="inline-flex min-h-11 items-center rounded px-1 underline hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400"
        >
          Open-Meteo
        </a>
        {' · '}
        <a
          href="https://www.geonames.org/"
          className="inline-flex min-h-11 items-center rounded px-1 underline hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400"
        >
          GeoNames
        </a>
      </p>
      {status === 'loading' ? (
        <LoadingState />
      ) : status === 'error' ? (
        onRetry ? (
          <ErrorState onRetry={onRetry} />
        ) : (
          <p role="alert">Não foi possível concluir a operação. Tente novamente.</p>
        )
      ) : status === 'empty' || cities.length === 0 ? (
        <EmptyState />
      ) : (
        <ul className="space-y-2">
          {cities.map((city) => {
            const showCoordinates = (identities.get(regionalIdentity(city)) ?? 0) > 1;
            const context = contextLabel(city, showCoordinates);
            return (
              <li key={city.id}>
                <button
                  type="button"
                  onClick={() => onSelect(city)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400"
                >
                  <span className="block font-semibold">{city.name}</span>{' '}
                  {context && <span className="block text-sm text-slate-300">{context}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
