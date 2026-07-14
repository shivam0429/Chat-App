import { useState } from 'react';
import { formatMessageTime } from '../utils/formatTime';

const StatusTicks = ({ status }) => {
  if (status === 'read') {
    return <span className="text-brand-200">✓✓</span>;
  }
  if (status === 'delivered') {
    return <span className="text-white/70">✓✓</span>;
  }
  return <span className="text-white/70">✓</span>;
};

const MessageBubble = ({ message, isOwn }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.message);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className={`group flex animate-message-in ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[75%] flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
        {!isOwn && (
          <span className="mb-1 px-1 text-xs font-semibold text-brand-600 dark:text-brand-400">
            {message.username}
          </span>
        )}
        <div className="relative">
          <div
            className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
              isOwn
                ? 'rounded-br-md bg-brand-600 text-white'
                : 'rounded-bl-md bg-white text-slate-800 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700'
            }`}
          >
            <p className="whitespace-pre-wrap break-words">{message.message}</p>
            <div
              className={`mt-1 flex items-center gap-1 text-[10px] ${
                isOwn ? 'justify-end text-white/70' : 'justify-end text-slate-400'
              }`}
            >
              <span>{formatMessageTime(message.createdAt)}</span>
              {isOwn && <StatusTicks status={message.status} />}
            </div>
          </div>

          <button
            onClick={handleCopy}
            title="Copy message"
            className={`absolute top-1/2 -translate-y-1/2 rounded-full bg-slate-900/80 px-2 py-1 text-[10px] text-white opacity-0 transition group-hover:opacity-100 ${
              isOwn ? '-left-14' : '-right-14'
            }`}
          >
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
