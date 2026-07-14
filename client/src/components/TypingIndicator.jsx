const TypingIndicator = ({ typingUsers }) => {
  if (!typingUsers.length) return null;

  const label =
    typingUsers.length === 1
      ? `${typingUsers[0]} is typing`
      : typingUsers.length === 2
      ? `${typingUsers[0]} and ${typingUsers[1]} are typing`
      : `${typingUsers.length} people are typing`;

  return (
    <div className="flex items-center gap-2 px-4 py-1 text-xs text-slate-400">
      <span className="flex gap-1">
        <span className="h-1.5 w-1.5 animate-bounce-dot rounded-full bg-slate-400 [animation-delay:-0.2s]" />
        <span className="h-1.5 w-1.5 animate-bounce-dot rounded-full bg-slate-400 [animation-delay:-0.1s]" />
        <span className="h-1.5 w-1.5 animate-bounce-dot rounded-full bg-slate-400" />
      </span>
      {label}
    </div>
  );
};

export default TypingIndicator;
