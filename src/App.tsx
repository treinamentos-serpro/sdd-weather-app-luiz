import { useEffect, useRef } from 'react';
import interLicenseUrl from '@fontsource/inter/LICENSE?url';
import CityResults from './components/CityResults';
import CurrentWeather from './components/CurrentWeather';
import ForecastList from './components/ForecastList';
import SearchBar from './components/SearchBar';
import UnitToggle from './components/UnitToggle';
import EmptyState from './components/states/EmptyState';
import ErrorState from './components/states/ErrorState';
import LoadingState from './components/states/LoadingState';
import { useWeather } from './hooks/useWeather';

export default function App() {
  const mainRef = useRef<HTMLElement>(null);
  const weatherHeadingRef = useRef<HTMLHeadingElement>(null);
  const {
    unit,
    setUnit,
    status,
    data,
    cities,
    error,
    search,
    selectCity,
    retry,
    clearError,
    canRetry,
    errorReason,
    selectedCity,
  } = useWeather();

  useEffect(() => {
    if (status === 'success') weatherHeadingRef.current?.focus();
  }, [status]);

  return (
    <div className="min-h-screen bg-night-900 font-sans text-white">
      <a
        href="#main-content"
        className="sr-only rounded bg-accent-400 p-3 text-night-900 focus:not-sr-only focus:absolute focus:z-10"
      >
        Pular para o conteúdo
      </a>
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
        <header className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-accent-400">SDD Weather App</p>
              <h1 className="mt-1 text-3xl font-semibold">Previsão do tempo</h1>
            </div>
            <UnitToggle unit={unit} onChange={setUnit} />
          </div>
          <SearchBar onSearch={search} onEdit={clearError} disabled={status === 'loading'} />
        </header>
        <main
          ref={mainRef}
          id="main-content"
          tabIndex={-1}
          aria-busy={status === 'loading'}
          aria-label={
            selectedCity ? `Consulta meteorológica: ${selectedCity.name}` : 'Consulta meteorológica'
          }
          className="mt-8 space-y-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-400"
        >
          {cities.length > 0 && <CityResults cities={cities} onSelect={selectCity} />}
          {(status === 'loading' || status === 'error') && selectedCity && (
            <p>Consulta para {selectedCity.name}</p>
          )}
          {status === 'idle' && (
            <EmptyState title="Consulte o clima" hint="Busque uma cidade para começar." />
          )}
          {status === 'loading' && <LoadingState />}
          {status === 'empty' && <EmptyState />}
          {status === 'error' && !canRetry && <p role="alert">{error}</p>}
          {status === 'error' && canRetry && (
            <ErrorState
              message={error ?? undefined}
              onRetry={() => {
                void retry();
                mainRef.current?.focus();
              }}
              timeout={errorReason === 'timeout'}
            />
          )}
          {status === 'success' && data && (
            <>
              <CurrentWeather
                city={data.city}
                current={data.current}
                unit={unit}
                timezone={data.timezone}
                headingRef={weatherHeadingRef}
              />
              <ForecastList forecast={data.forecast} timezone={data.timezone} unit={unit} />
            </>
          )}
        </main>
        <footer className="mt-10 text-center text-sm text-slate-400">
          Projeto de treinamento SDD · Dados de{' '}
          <a
            href="https://open-meteo.com/"
            className="underline hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-400"
          >
            Open-Meteo
          </a>
          {' · '}
          <a
            href="https://creativecommons.org/licenses/by/4.0/"
            className="underline hover:text-white"
          >
            CC BY 4.0
          </a>
          <p>Temperaturas convertidas e valores arredondados para exibição.</p>
          <p>
            Geocodificação:{' '}
            <a href="https://www.geonames.org/" className="underline hover:text-white">
              GeoNames
            </a>
            {' · '}
            <a
              href={`${import.meta.env.BASE_URL}privacy.html`}
              className="underline hover:text-white"
            >
              Política de privacidade
            </a>
          </p>
          <p>
            <a
              href={interLicenseUrl}
              className="inline-flex min-h-11 items-center rounded px-1 underline hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400"
            >
              Licença da fonte Inter (OFL)
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}
