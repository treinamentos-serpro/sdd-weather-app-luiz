export function formatDayLabel(
  localDate: string,
  referenceYear = new Date().getUTCFullYear(),
): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(localDate)) return 'Indisponível';
  const date = new Date(`${localDate}T00:00:00Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== localDate) {
    return 'Indisponível';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'UTC',
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    ...(date.getUTCFullYear() !== referenceYear ? { year: 'numeric' } : {}),
  }).format(date);
}

export function formatLocalObservationTime(
  value: string | null | undefined,
  timezone: string | null | undefined,
): string | null {
  if (!value || !isValidTimezone(timezone)) return null;

  const match = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})(?::\d{2}(?:\.\d+)?)?$/.exec(value);
  if (!match) return null;

  const [, localDate, hour, minute] = match;
  const date = new Date(`${localDate}T00:00:00Z`);
  if (
    !Number.isFinite(date.getTime()) ||
    date.toISOString().slice(0, 10) !== localDate ||
    Number(hour) > 23 ||
    Number(minute) > 59
  ) {
    return null;
  }

  const dateLabel = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
  return `${dateLabel} às ${hour}:${minute}`;
}

export function formatProbability(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value) || value < 0 || value > 100) {
    return 'Indisponível';
  }
  return `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(value)} %`;
}

export function formatMeasurement(
  value: number | null | undefined,
  suffix: string,
  maximum = Infinity,
  fractionDigits = 1,
): string {
  if (value == null || !Number.isFinite(value) || value < 0 || value > maximum) {
    return 'Indisponível';
  }
  const formatted = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);
  return `${formatted} ${suffix}`;
}

export function isValidTimezone(timezone: string | null | undefined): timezone is string {
  if (!timezone) return false;
  try {
    new Intl.DateTimeFormat('pt-BR', { timeZone: timezone });
    return true;
  } catch (error) {
    if (error instanceof RangeError) return false;
    throw error;
  }
}
