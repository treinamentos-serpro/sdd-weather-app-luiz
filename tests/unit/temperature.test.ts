import { describe, expect, it } from 'vitest';
import { celsiusToFahrenheit, formatTemperature } from '../../src/lib/temperature';

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
    [1.25, '1,3 °C'],
    [-1.25, '-1,3 °C'],
    [0, '0,0 °C'],
  ])('formata %s com half-up', (value, expected) => {
    expect(formatTemperature(value, 'celsius')).toBe(expected);
  });

  it.each([null, Number.NaN, Infinity, -Infinity])('trata %s como indisponível', (value) => {
    expect(formatTemperature(value, 'celsius')).toBe('Indisponível');
    expect(formatTemperature(value, 'fahrenheit')).toBe('Indisponível');
  });
});
