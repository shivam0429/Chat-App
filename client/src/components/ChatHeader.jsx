import { useState } from 'react';
import ConnectionStatus from './ConnectionStatus';
import { useTheme } from '../context/ThemeContext';

const ChatHeader = ({
  title,
  subtitle,
  avatarChar,
  showOnlineDot,
  isConnected,
  isReconnecting,
  onClearChat,
  clearChatLabel = 'Clear chat',
  clearChatConfirmText = 'This will permanently delete all messages for everyone in the room.',
  showBackButton,
  onBack,
  showCallButtons,
  canCall,
  onAudioCall,
  onVideoCall,
}) => {
  const { isDark, toggleTheme } = useTheme();
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
      <div className="flex min-w-0 items-center gap-2">
        {showBackButton && (
          <button
            type="button"
            onClick={onBack}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg transition hover:bg-slate-100 dark:hover:bg-slate-800 sm:hidden"
            title="Back to chats"
          >
            ←
          </button>
        )}
        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-600 text-lg font-semibold text-white">
          {avatarChar}
          {showOnlineDot && (
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500 dark:border-slate-900" />
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{title}</p>
          <p className="truncate text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        {showCallButtons && (
          <>
            <button
              type="button"
              onClick={onAudioCall}
              disabled={!canCall}
              className="flex h-9 w-9 items-center justify-center rounded-full text-base transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-slate-800"
              title={canCall ? 'Start audio call' : 'User is offline'}
            >
              📞
            </button>
            <button
              type="button"
              onClick={onVideoCall}
              disabled={!canCall}
              className="flex h-9 w-9 items-center justify-center rounded-full text-base transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-slate-800"
              title={canCall ? 'Start video call' : 'User is offline'}
            >
              🎥
            </button>
          </>
        )}

        <ConnectionStatus isConnected={isConnected} isReconnecting={isReconnecting} />

        <button
          type="button"
          onClick={toggleTheme}
          className="flex h-9 w-9 items-center justify-center rounded-full text-base transition hover:bg-slate-100 dark:hover:bg-slate-800"
          title="Toggle dark mode"
        >
          {isDark ? '☀️' : '🌙'}
        </button>

        <button
          type="button"
          onClick={() => setShowClearConfirm(true)}
          className="flex h-9 w-9 items-center justify-center rounded-full text-base text-slate-500 transition hover:bg-red-50 hover:text-red-500 dark:text-slate-400 dark:hover:bg-red-950/40"
          title={clearChatLabel}
        >
          🗑
        </button>
      </div>

      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">{clearChatLabel}?</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{clearChatConfirmText}</p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowClearConfirm(false);
                  onClearChat();
                }}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default ChatHeader;
