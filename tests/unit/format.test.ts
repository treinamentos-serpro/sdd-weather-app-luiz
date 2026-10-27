import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  formatDayLabel,
  formatLocalObservationTime,
  formatMeasurement,
  formatProbability,
  isValidTimezone,
} from '../../src/lib/format';

afterEach(() => vi.useRealTimers());

describe('Datas locais', () => {
  it('formata o calendário sem deslocamento de fuso e inclui ano quando necessário', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-27T12:00:00Z'));
    expect(formatDayLabel('2026-10-27')).toBe('ter., 27/10');
    expect(formatDayLabel('2027-01-01')).toBe('sex., 01/01/2027');
    expect(formatDayLabel('2026-01-01')).toBe('qui., 01/01');
    expect(formatDayLabel('2024-02-29', 2024)).toBe('qui., 29/02');
  });

  it.each([
    '',
    '2026-02-29',
    '2026-02-30',
    '2026-13-01',
    '2026-1-01',
    'invalid',
  ])('indica data inválida %s', (value) => expect(formatDayLabel(value)).toBe('Indisponível'));

  it.each([
    'America/Sao_Paulo',
    'Pacific/Kiritimati',
    'Pacific/Honolulu',
    'UTC',
  ])('aceita fuso %s', (value) => expect(isValidTimezone(value)).toBe(true));
  it.each([null, '', 'invalid'])('rejeita fuso %s', (value) => {
    expect(isValidTimezone(value)).toBe(false);
  });
});

describe('Probabilidade', () => {
  it.each([
    [0, '0 %'],
    [100, '100 %'],
    [12.5, '13 %'],
  ])('formata %s', (value, label) => {
    expect(formatProbability(value)).toBe(label);
  });
  it.each([null, -1, 101, Infinity, Number.NaN])('rejeita %s', (value) => {
    expect(formatProbability(value)).toBe('Indisponível');
  });
});

describe('Medições', () => {
  it('formata valores finitos com uma casa decimal e unidade', () => {
    expect(formatMeasurement(4.25, 'mm')).toBe('4,3 mm');
    expect(formatMeasurement(64, '%', 100, 0)).toBe('64 %');
  });

  it.each([null, undefined, -1, 101, Infinity, Number.NaN])(
    'usa fallback para medição ausente ou fora do domínio: %s',
    (value) => {
      expect(formatMeasurement(value, 'km/h', 100)).toBe('Indisponível');
    },
  );
});

describe('Horário de referência', () => {
  it('formata a data e a hora local recebidas com fuso válido', () => {
    expect(formatLocalObservationTime('2026-10-27T12:05', 'America/Sao_Paulo')).toBe(
      '27/10/2026 às 12:05',
    );
  });

  it.each([
    [null, 'America/Sao_Paulo'],
    ['2026-10-27T12:05', null],
    ['2026-10-27T12:05', 'invalid'],
    ['2026-02-30T12:05', 'UTC'],
    ['2026-10-27T24:00', 'UTC'],
    ['not-a-time', 'UTC'],
  ])('não apresenta timestamp ausente ou inválido %j', (value, timezone) => {
    expect(formatLocalObservationTime(value, timezone)).toBeNull();
  });
});
