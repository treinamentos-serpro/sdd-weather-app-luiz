export type Unit = 'celsius' | 'fahrenheit';

export type TemperatureUnit = Unit;

export interface City {
  id: string;
  name: string;
  region: string | null;
  country: string | null;
  latitude: number;
  longitude: number;
}

export interface CurrentWeather {
  observedAt: string | null;
  weatherCode: number | null;
  temperatureC: number | null;
  apparentTemperatureC: number | null;
  relativeHumidity: number | null;
  precipitationMm: number | null;
  windSpeedKmh: number | null;
  pressureHpa: number | null;
}

export interface ForecastDay {
  localDate: string;
  weatherCode: number | null;
  minimumTemperatureC: number | null;
  maximumTemperatureC: number | null;
  precipitationSumMm: number | null;
  precipitationProbabilityMax: number | null;
  maximumWindSpeedKmh: number | null;
}

export interface WeatherData {
  city: City;
  timezone: string | null;
  current: CurrentWeather;
  forecast: ForecastDay[];
}

export type WeatherSnapshot = WeatherData;

export type OperationError = {
  reason: 'network' | 'api' | 'timeout';
};

export type SearchState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: City[] }
  | { status: 'empty' }
  | { status: 'error'; error: OperationError };

export type WeatherState =
  | { status: 'idle' }
  | { status: 'loading'; city: City }
  | { status: 'success'; data: WeatherSnapshot }
  | { status: 'error'; city: City; error: OperationError };
