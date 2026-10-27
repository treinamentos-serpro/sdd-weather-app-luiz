import { describe, expect, it } from 'vitest';
import { getWeatherCondition } from '../../src/lib/weatherCodes';

describe('Códigos WMO', () => {
  it.each([
    [0, 'Céu limpo'],
    [1, 'Predominantemente limpo'],
    [2, 'Parcialmente nublado'],
    [3, 'Encoberto'],
    [45, 'Nevoeiro'],
    [48, 'Nevoeiro com deposição de geada'],
    [51, 'Chuvisco leve'],
    [53, 'Chuvisco moderado'],
    [55, 'Chuvisco intenso'],
    [56, 'Chuvisco congelante leve'],
    [57, 'Chuvisco congelante intenso'],
    [61, 'Chuva fraca'],
    [63, 'Chuva moderada'],
    [65, 'Chuva forte'],
    [66, 'Chuva congelante fraca'],
    [67, 'Chuva congelante forte'],
    [71, 'Neve fraca'],
    [73, 'Neve moderada'],
    [75, 'Neve forte'],
    [77, 'Grãos de neve'],
    [80, 'Pancadas de chuva leves'],
    [81, 'Pancadas de chuva moderadas'],
    [82, 'Pancadas de chuva violentas'],
    [85, 'Pancadas de neve leves'],
    [86, 'Pancadas de neve fortes'],
    [95, 'Trovoada fraca ou moderada'],
    [96, 'Trovoada com granizo leve'],
    [99, 'Trovoada com granizo forte'],
  ] as const)('mapeia %s para o rótulo obrigatório', (code, label) => {
    expect(getWeatherCondition(code)?.label).toBe(label);
    expect(getWeatherCondition(code)?.icon).toBeTruthy();
  });

  it.each([null, -1, 123, 1.5, Number.NaN, Infinity])('não inventa condição para %s', (code) =>
    expect(getWeatherCondition(code)).toBeNull());
});
