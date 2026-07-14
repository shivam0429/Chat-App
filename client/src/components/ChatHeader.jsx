import { useState } from 'react';
import ConnectionStatus from './ConnectionStatus';
import { useTheme } from '../context/ThemeContext';

const IconButton = ({
  children,
  title,
  onClick,
  disabled,
  accent = false,
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    aria-label={title}
    title={title}
    className={`group flex h-8 min-w-8 shrink-0 items-center justify-center gap-2 rounded-full px-2 transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-40 sm:h-10 sm:min-w-10 sm:px-3 ${
      accent
        ? 'bg-[#e7fce9] text-[#008069] hover:bg-[#d8f8dc] dark:bg-[#103d35] dark:text-[#25d366] dark:hover:bg-[#174d43]'
        : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
    }`}
  >
    {children}
  </button>
);

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
    <header className="flex min-h-[60px] items-center justify-between gap-1 border-b border-slate-200 bg-[#f0f2f5] px-2 py-2 shadow-sm dark:border-slate-800 dark:bg-[#202c33] sm:min-h-[68px] sm:gap-3 sm:px-4">
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
        {showBackButton && (
          <button
            type="button"
            onClick={onBack}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-600 transition hover:bg-black/5 dark:text-slate-200 dark:hover:bg-white/10 sm:hidden"
            title="Back to chats"
            aria-label="Back to chats"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                d="M15 18l-6-6 6-6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}

        <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#00a884] text-sm font-semibold text-white shadow-sm sm:h-11 sm:w-11 sm:text-lg">
          {avatarChar}

          {showOnlineDot && (
            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#f0f2f5] bg-[#25d366] dark:border-[#202c33] sm:h-3.5 sm:w-3.5" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-[#111b21] dark:text-[#e9edef] sm:text-[15px]">
            {title}
          </p>

          <p className="truncate text-[11px] text-[#667781] dark:text-[#8696a0] sm:text-xs">
            {subtitle}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
        {showCallButtons && (
          <>
            <IconButton
              title={canCall ? 'Start audio call' : 'User is offline'}
              onClick={onAudioCall}
              disabled={!canCall}
              accent
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4 sm:h-5 sm:w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.79 19.79 0 012.12 4.18 2 2 0 014.11 2h3a2 2 0 012 1.72c.12.9.33 1.78.62 2.63a2 2 0 01-.45 2.11L8 9.73a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.85.29 1.73.5 2.63.62A2 2 0 0122 16.92z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>

              <span className="hidden text-sm font-semibold lg:inline">
                Audio
              </span>
            </IconButton>

            <IconButton
              title={canCall ? 'Start video call' : 'User is offline'}
              onClick={onVideoCall}
              disabled={!canCall}
              accent
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4 sm:h-5 sm:w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="3" y="5" width="13" height="14" rx="2" />

                <path
                  d="M16 10l5-3v10l-5-3z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>

              <span className="hidden text-sm font-semibold lg:inline">
                Video
              </span>
            </IconButton>
          </>
        )}

        <div className="hidden md:block">
          <ConnectionStatus
            isConnected={isConnected}
            isReconnecting={isReconnecting}
          />
        </div>

        <IconButton title="Toggle dark mode" onClick={toggleTheme}>
          {isDark ? (
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4 sm:h-5 sm:w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="4" />

              <path
                d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
                strokeLinecap="round"
              />
            </svg>
          ) : (
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4 sm:h-5 sm:w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </IconButton>

        <IconButton
          title={clearChatLabel}
          onClick={() => setShowClearConfirm(true)}
        >
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4 sm:h-5 sm:w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              d="M3 6h18M8 6V4h8v2m-7 4v7m6-7v7M5 6l1 15h12l1-15"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </IconButton>
      </div>

      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl dark:bg-[#202c33]">
            <h3 className="text-base font-semibold text-[#111b21] dark:text-[#e9edef]">
              {clearChatLabel}?
            </h3>

            <p className="mt-2 text-sm leading-6 text-[#667781] dark:text-[#8696a0]">
              {clearChatConfirmText}
            </p>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="rounded-full px-4 py-2 text-sm font-semibold text-[#008069] transition hover:bg-[#e7fce9] dark:text-[#25d366] dark:hover:bg-[#103d35]"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowClearConfirm(false);
                  onClearChat();
                }}
                className="rounded-full bg-[#008069] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#006e5b]"
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

