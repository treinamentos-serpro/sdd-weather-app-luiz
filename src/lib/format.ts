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

export function formatProbability(value: number | null): string {
  if (value === null || !Number.isFinite(value) || value < 0 || value > 100) {
    return 'Indisponível';
  }
  return `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(value)} %`;
}

export function isValidTimezone(timezone: string | null): timezone is string {
  if (!timezone) return false;
  try {
    new Intl.DateTimeFormat('pt-BR', { timeZone: timezone });
    return true;
  } catch (error) {
    if (error instanceof RangeError) return false;
    throw error;
  }
}
