import { useEffect } from 'react';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import EmptyState from './EmptyState';
import { groupMessagesByDate } from '../utils/formatTime';
import { useAutoScroll } from '../hooks/useAutoScroll';

const MessageList = ({ messages, username, currentUserId, typingUsers, isDm }) => {
  const { containerRef, bottomRef, handleScroll, isAtBottom, scrollToBottom } = useAutoScroll([
    messages.length,
  ]);

  useEffect(() => {
    scrollToBottom('auto');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!messages.length) {
    return <EmptyState isDm={isDm} />;
  }

  const groups = groupMessagesByDate(messages);

  return (
    <div className="relative flex h-full flex-col overflow-hidden">
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 space-y-4 overflow-y-auto px-4 py-4"
      >
        {groups.map((group) => (
          <div key={group.dateKey} className="space-y-3">
            <div className="flex justify-center">
              <span className="rounded-full bg-slate-200/70 px-3 py-1 text-[11px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                {group.label}
              </span>
            </div>
            {group.messages.map((message) => (
              <MessageBubble
                key={message._id}
                message={message}
                isOwn={
                  message.sender
                    ? String(message.sender) === String(currentUserId)
                    : message.username === username
                }
              />
            ))}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <TypingIndicator typingUsers={typingUsers} />

      {!isAtBottom && (
        <button
          onClick={() => scrollToBottom()}
          className="absolute bottom-16 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-white shadow-lg transition hover:bg-brand-700"
          title="Scroll to latest"
        >
          ↓
        </button>
      )}
    </div>
  );
};

export default MessageList;
