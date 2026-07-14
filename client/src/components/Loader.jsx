const Loader = ({ label = 'Loading messages…' }) => (
  <div className="flex h-full flex-col items-center justify-center gap-3 text-slate-400">
    <div className="flex gap-1.5">
      <span className="h-2.5 w-2.5 animate-bounce-dot rounded-full bg-brand-500 [animation-delay:-0.2s]" />
      <span className="h-2.5 w-2.5 animate-bounce-dot rounded-full bg-brand-500 [animation-delay:-0.1s]" />
      <span className="h-2.5 w-2.5 animate-bounce-dot rounded-full bg-brand-500" />
    </div>
    <p className="text-sm">{label}</p>
  </div>
);

export default Loader;
