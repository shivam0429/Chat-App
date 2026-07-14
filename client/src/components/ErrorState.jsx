const ErrorState = ({ message = 'Something went wrong', onRetry }) => (
  <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-slate-400">
    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-3xl dark:bg-red-950">
      ⚠️
    </div>
    <p className="text-base font-medium text-slate-600 dark:text-slate-300">{message}</p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="rounded-full bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700"
      >
        Try again
      </button>
    )}
  </div>
);

export default ErrorState;
