import { describe, expect, it } from 'vitest';
import {
  celsiusToFahrenheit,
  convertTemperature,
  formatTemperature,
  unitLabel,
} from '../../src/lib/temperature';

describe('Temperatura', () => {
  it.each([
    [0, 32],
    [100, 212],
    [-40, -40],
  ])('converte %s °C para %s °F', (c, f) => {
    expect(celsiusToFahrenheit(c)).toBe(f);
    expect(formatTemperature(c, 'fahrenheit')).toBe(`${f},0 °F`);
  });

  it.each([
    [0, 0, 32],
    [20, 20, 68],
    [-40, -40, -40],
  ])('converte %s °C para a unidade selecionada', (celsius, celsiusResult, fahrenheitResult) => {
    expect(convertTemperature(celsius, 'celsius')).toBe(celsiusResult);
    expect(convertTemperature(celsius, 'fahrenheit')).toBe(fahrenheitResult);
  });

  it.each([
    [1.25, '1,3 °C'],
    [-1.25, '-1,3 °C'],
    [0, '0,0 °C'],
  ])('formata %s com half-up', (value, expected) => {
    expect(formatTemperature(value, 'celsius')).toBe(expected);
  });

  it.each([
    [20, 'fahrenheit', '68,0 °F'],
    [20, 'celsius', '20,0 °C'],
    [1.25, 'fahrenheit', '34,3 °F'],
    [-18.75, 'fahrenheit', '-1,8 °F'],
    [-17.5, 'fahrenheit', '0,5 °F'],
    [-40.25, 'fahrenheit', '-40,5 °F'],
  ] as const)('formata %s °C na unidade %s com arredondamento e símbolo', (value, unit, expected) => {
    expect(formatTemperature(value, unit)).toBe(expected);
  });

  it.each([
    ['celsius', '°C'],
    ['fahrenheit', '°F'],
  ] as const)('retorna o símbolo da unidade %s', (unit, label) => {
    expect(unitLabel(unit)).toBe(label);
  });

  it.each([null, undefined, Number.NaN, Infinity, -Infinity])(
    'trata %s como indisponível',
    (value) => {
    expect(formatTemperature(value, 'celsius')).toBe('Indisponível');
    expect(formatTemperature(value, 'fahrenheit')).toBe('Indisponível');
    },
  );

  it('não exibe infinito quando a conversão de um valor finito excede o limite numérico', () => {
    expect(formatTemperature(Number.MAX_VALUE, 'fahrenheit')).toBe('Indisponível');
  });
});
