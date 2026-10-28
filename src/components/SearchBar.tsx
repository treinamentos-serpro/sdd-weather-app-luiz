import { type FormEvent, useId, useState } from 'react';
import { validateSearch } from '../lib/search';

interface SearchBarProps {
  onSearch: (city: string) => void;
  disabled?: boolean;
  onEdit?: () => void;
  errorMessage?: string | null;
  loading?: boolean;
}

export default function SearchBar({
  onSearch,
  disabled = false,
  onEdit,
  errorMessage = null,
  loading = false,
}: SearchBarProps) {
  const inputId = useId();
  const errorId = `${inputId}-error`;
  const [city, setCity] = useState('');
  const [error, setError] = useState<string | null>(null);
  const message = error ?? errorMessage;
  const blocked = disabled || loading;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (blocked) return;

    const query = city.trim();
    const validationError = validateSearch(query);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    onSearch(query);
  }

  return (
    <form
      role="search"
      aria-label="Buscar cidade"
      onSubmit={handleSubmit}
      className="rounded-2xl border border-white/10 bg-white/5 p-4 font-sans text-white shadow-glass backdrop-blur-md sm:p-6"
    >
      <label htmlFor={inputId} className="mb-2 block text-sm font-medium">
        Nome da cidade
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          id={inputId}
          type="search"
          name="city"
          value={city}
          disabled={blocked}
          aria-invalid={message ? true : undefined}
          aria-describedby={message ? errorId : undefined}
          onChange={(event) => {
            setCity(event.target.value);
            setError(null);
            onEdit?.();
          }}
          placeholder="Ex.: São Paulo"
          className="min-w-0 flex-1 rounded-xl border border-slate-500 bg-night-900 px-4 py-3 text-white placeholder:text-slate-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400 disabled:cursor-not-allowed disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={blocked}
          className="rounded-xl bg-accent-400 px-6 py-3 font-semibold text-night-900 hover:bg-accent-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-accent-400"
        >
          Buscar
        </button>
      </div>
      {loading && <p role="status">Carregando dados meteorológicos...</p>}
      {message && (
        <p id={errorId} role="alert" className="mt-3 text-sm text-red-300">
          {message}
        </p>
      )}
    </form>
  );
}
