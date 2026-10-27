interface ErrorStateProps {
  message?: string;
  onRetry: () => void;
}

export default function ErrorState({
  message = 'Não foi possível concluir a operação. Tente novamente.',
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center font-sans text-white shadow-glass backdrop-blur-md">
      <p role="alert" className="text-red-300">
        {message}
      </p>
      <button
        type="button"
        onClick={() => onRetry()}
        className="mt-4 min-h-11 rounded-xl bg-accent-400 px-6 py-3 font-semibold text-night-900 hover:bg-accent-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400"
      >
        Tentar novamente
      </button>
    </div>
  );
}
