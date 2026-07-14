const ConversationSidebar = ({
  activeConversation,
  onSelectPublic,
  onSelectUser,
  users,
  onlineUsernames,
  unreadCounts,
  currentUsername,
  onLogout,
}) => {
  return (
    <aside className="flex h-full w-full flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 sm:w-72">
      <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-800">
        <p className="text-sm font-semibold text-slate-900 dark:text-white">Chats</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        <button
          type="button"
          onClick={onSelectPublic}
          className={`flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800 ${
            activeConversation?.type === 'public' ? 'bg-brand-50 dark:bg-slate-800' : ''
          }`}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-600 text-lg font-semibold text-white">
            #
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-900 dark:text-white">Public Room</p>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">Everyone in ChatFlow</p>
          </div>
        </button>

        <div className="my-1 h-px bg-slate-100 dark:bg-slate-800" />

        {users.map((u) => {
          const isActive = activeConversation?.type === 'dm' && activeConversation.userId === u.id;
          const isOnline = onlineUsernames.includes(u.username);
          const unread = unreadCounts[u.id];

          return (
            <button
              key={u.id}
              type="button"
              onClick={() => onSelectUser(u)}
              className={`flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800 ${
                isActive ? 'bg-brand-50 dark:bg-slate-800' : ''
              }`}
            >
              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-300 text-sm font-semibold text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                {u.username?.charAt(0).toUpperCase()}
                {isOnline && (
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500 dark:border-slate-900" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-900 dark:text-white">{u.username}</p>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                  {isOnline ? 'Online' : 'Offline'}
                </p>
              </div>
              {!!unread && (
                <span className="flex h-5 min-w-[1.25rem] shrink-0 items-center justify-center rounded-full bg-brand-600 px-1.5 text-[10px] font-semibold text-white">
                  {unread}
                </span>
              )}
            </button>
          );
        })}

        {!users.length && (
          <p className="px-4 py-6 text-center text-xs text-slate-400">No other users yet.</p>
        )}
      </div>

      <div className="border-t border-slate-200 px-4 py-3 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white">
            {currentUsername?.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-900 dark:text-white">{currentUsername}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Signed in</p>
          </div>
          <button
            type="button"
            onClick={onLogout}
            title="Logout"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm text-slate-500 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            ⏻
          </button>
        </div>
      </div>
    </aside>
  );
};

export default ConversationSidebar;
