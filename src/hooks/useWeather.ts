import { useCallback, useEffect, useRef, useState } from 'react';
import { validateSearch } from '../lib/search';
import { getWeather, searchCities, WeatherServiceError } from '../services/weatherService';
import type { City, WeatherData } from '../types/weather';

type Operation = { type: 'search'; query: string } | { type: 'select'; city: City };

type WeatherHookState = {
  cities: City[];
  query: string;
} & (
  | { status: 'idle' | 'loading' | 'empty'; data: null; error: null }
  | { status: 'success'; data: WeatherData; error: null }
  | { status: 'error'; data: null; error: string; errorType: 'validation' | 'operation' }
);

interface ActiveOperation {
  controller: AbortController;
  timer: ReturnType<typeof setTimeout>;
}

export function useWeather() {
  const [state, setState] = useState<WeatherHookState>({
    status: 'idle',
    data: null,
    cities: [],
    error: null,
    query: '',
  });
  const active = useRef<ActiveOperation | null>(null);
  const lastOperation = useRef<Operation | null>(null);
  const mounted = useRef(true);

  const cancel = useCallback(() => {
    const previous = active.current;
    active.current = null;
    if (previous) {
      clearTimeout(previous.timer);
      previous.controller.abort();
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      cancel();
    };
  }, [cancel]);

  const run = useCallback(
    async (operation: Operation) => {
      if (!mounted.current) return;
      cancel();

      const validationError = operation.type === 'search' ? validateSearch(operation.query) : null;
      if (operation.type === 'search' && validationError) {
        lastOperation.current = null;
        setState({
          status: 'error',
          data: null,
          cities: [],
          query: operation.query,
          error: validationError,
          errorType: 'validation',
        });
        return;
      }
      lastOperation.current = operation;

      const controller = new AbortController();
      const current: ActiveOperation = {
        controller,
        timer: setTimeout(() => {
          if (active.current !== current) return;
          active.current = null;
          controller.abort();
          setState((previous) => ({
            ...previous,
            status: 'error',
            data: null,
            error: 'A requisição demorou demais.',
            errorType: 'operation',
          }));
        }, 8000),
      };
      active.current = current;
      setState((previous) => ({
        ...previous,
        status: 'loading',
        data: null,
        error: null,
        query: operation.type === 'search' ? operation.query : previous.query,
        cities: operation.type === 'search' ? [] : previous.cities,
      }));

      try {
        let city: City;
        if (operation.type === 'search') {
          const cities = await searchCities(operation.query, controller.signal);
          if (active.current !== current) return;
          setState((previous) => ({ ...previous, cities }));
          if (!cities.length) {
            setState((previous) => ({ ...previous, status: 'empty', data: null, error: null }));
            return;
          }
          city = cities[0];
        } else {
          city = operation.city;
        }
        const data = await getWeather(city, controller.signal);
        if (active.current === current) {
          setState((previous) => ({ ...previous, status: 'success', data, error: null }));
        }
      } catch (cause) {
        if (active.current !== current) return;
        if (!(cause instanceof WeatherServiceError)) {
          console.error('Falha inesperada na operação meteorológica.', cause);
        }
        setState((previous) => ({
          ...previous,
          status: 'error',
          data: null,
          error:
            cause instanceof WeatherServiceError
              ? cause.message
              : 'Não foi possível concluir a operação. Tente novamente.',
          errorType: 'operation',
        }));
      } finally {
        clearTimeout(current.timer);
        if (active.current === current) active.current = null;
      }
    },
    [cancel],
  );

  const search = useCallback((name: string) => run({ type: 'search', query: name.trim() }), [run]);
  const selectCity = useCallback((city: City) => run({ type: 'select', city }), [run]);
  const retry = useCallback(async () => {
    if (lastOperation.current) await run(lastOperation.current);
  }, [run]);
  const clearError = useCallback(() => {
    setState((previous) =>
      previous.status === 'error'
        ? { status: 'idle', data: null, error: null, cities: [], query: previous.query }
        : previous,
    );
    lastOperation.current = null;
  }, []);

  return {
    ...state,
    search,
    selectCity,
    retry,
    clearError,
    canRetry: state.status === 'error' && state.errorType === 'operation',
  };
}

export default useWeather;
