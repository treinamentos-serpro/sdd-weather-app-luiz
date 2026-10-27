import type { Unit } from '../types/weather';

export function celsiusToFahrenheit(celsius: number): number {
  return (celsius * 9) / 5 + 32;
}

export function formatTemperature(celsius: number | null, unit: Unit): string {
  if (celsius === null || !Number.isFinite(celsius)) return 'Indisponível';

  const temperature = unit === 'fahrenheit' ? celsiusToFahrenheit(celsius) : celsius;
  if (!Number.isFinite(temperature)) return 'Indisponível';

  const formatted = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(temperature);

  return `${formatted} ${unit === 'fahrenheit' ? '°F' : '°C'}`;
}
