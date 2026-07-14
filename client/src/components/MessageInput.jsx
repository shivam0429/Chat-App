import { useRef, useState, useEffect } from 'react';

const QUICK_EMOJIS = ['😀', '😂', '😍', '👍', '🙏', '🎉', '🔥', '❤️', '😢', '😮', '👏', '🤔'];

const MessageInput = ({ onSend, onTyping, onStopTyping, disabled }) => {
  const [text, setText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const inputRef = useRef(null);
  const emojiRef = useRef(null);

   useEffect(() => {                        
    const handleClickOutside = (e) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target)) {
        setShowEmoji(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChange = (e) => {
    setText(e.target.value);
    if (e.target.value.trim()) {
      onTyping();
    } else {
      onStopTyping();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText('');
    onStopTyping();
    inputRef.current?.focus();
  };

  const handleEmojiClick = (emoji) => {
    setText((prev) => prev + emoji);
    setShowEmoji(false);
    inputRef.current?.focus();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="relative flex items-end gap-2 border-t border-slate-200 bg-white/80 p-3 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80"
    >
      {showEmoji && (
       <div ref={emojiRef} className="absolute bottom-16 left-3 grid grid-cols-6 gap-1 rounded-xl bg-white p-2 shadow-xl ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
          {QUICK_EMOJIS.map((emoji) => (
            <button
              type="button"
              key={emoji}
              onClick={() => handleEmojiClick(emoji)}
              className="rounded-lg p-1.5 text-lg transition hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => setShowEmoji((prev) => !prev)}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xl transition hover:bg-slate-100 dark:hover:bg-slate-800"
        title="Emoji"
      >
        🙂
      </button>

      <textarea
        ref={inputRef}
        value={text}
        onChange={handleChange}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            handleSubmit(e);
          }
        }}
        placeholder={disabled ? 'Connecting…' : 'Type a message'}
        rows={1}
        disabled={disabled}
        className="max-h-28 flex-1 resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
      />

      <button
        type="submit"
        disabled={disabled || !text.trim()}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white shadow-md shadow-brand-600/30 transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
        title="Send"
      >
        ➤
      </button>
    </form>
  );
};

export default MessageInput;
