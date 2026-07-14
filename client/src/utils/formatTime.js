export const formatMessageTime = (dateInput) => {
  const date = new Date(dateInput);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const formatDateSeparator = (dateInput) => {
  const date = new Date(dateInput);
  const now = new Date();

  const isSameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (isSameDay(date, now)) return 'Today';

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isSameDay(date, yesterday)) return 'Yesterday';

  return date.toLocaleDateString([], {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
};

export const formatRelativeOrTime = (dateInput) => {
  const date = new Date(dateInput);
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  return formatMessageTime(date);
};

export const groupMessagesByDate = (messages) => {
  const groups = [];
  let currentDateKey = null;

  messages.forEach((msg) => {
    const dateKey = new Date(msg.createdAt).toDateString();
    if (dateKey !== currentDateKey) {
      groups.push({ dateKey, label: formatDateSeparator(msg.createdAt), messages: [] });
      currentDateKey = dateKey;
    }
    groups[groups.length - 1].messages.push(msg);
  });

  return groups;
};
