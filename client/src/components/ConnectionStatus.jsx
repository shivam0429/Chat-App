const ConnectionStatus = ({ isConnected, isReconnecting }) => {
  let label = 'Online';
  let dotClass = 'bg-emerald-500';

  if (isReconnecting) {
    label = 'Reconnecting…';
    dotClass = 'bg-amber-500';
  } else if (!isConnected) {
    label = 'Offline';
    dotClass = 'bg-red-500';
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
      <span className={`h-2 w-2 rounded-full ${dotClass} ${isConnected && !isReconnecting ? 'animate-pulse' : ''}`} />
      {label}
    </span>
  );
};

export default ConnectionStatus;
