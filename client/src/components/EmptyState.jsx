const EmptyState = ({ isDm }) => (
  <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-slate-400">
    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-3xl dark:bg-slate-800">
      💬
    </div>
    <p className="text-base font-medium text-slate-600 dark:text-slate-300">No messages yet</p>
    <p className="max-w-xs text-sm">
      {isDm
        ? 'Say hello! Messages here are private, just between you two.'
        : 'Say hello! Messages sent here are visible to everyone in the room.'}
    </p>
  </div>
);

export default EmptyState;
