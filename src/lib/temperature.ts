import type { Unit } from '../types/weather';

export function celsiusToFahrenheit(celsius: number): number {
  return (celsius * 9) / 5 + 32;
}

export function convertTemperature(celsius: number, unit: Unit): number {
  return unit === 'fahrenheit' ? celsiusToFahrenheit(celsius) : celsius;
}

export function unitLabel(unit: Unit): string {
  return unit === 'fahrenheit' ? '°F' : '°C';
}

export function formatTemperature(celsius: number | null | undefined, unit: Unit): string {
  if (celsius == null || !Number.isFinite(celsius)) return 'Indisponível';

  const temperature = convertTemperature(celsius, unit);
  if (!Number.isFinite(temperature)) return 'Indisponível';

  const formatted = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(temperature);

  return `${formatted} ${unitLabel(unit)}`;
}
