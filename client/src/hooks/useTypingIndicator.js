import { useCallback, useEffect, useRef, useState } from 'react';

const TYPING_TIMEOUT = 2000;

// `conversation` is either { type: 'public' } or { type: 'dm', userId }.
// Typing events are scoped so a DM typing indicator never leaks into the
// public room (or another DM) and vice versa.
export const useTypingIndicator = (socket, currentUsername, conversation) => {
  const [typingUsers, setTypingUsers] = useState([]);
  const typingTimeoutRef = useRef(null);

  const isDm = conversation?.type === 'dm';
  const dmUserId = conversation?.userId;

  // Reset the visible indicator whenever the open conversation changes.
  useEffect(() => {
    setTypingUsers([]);
  }, [isDm, dmUserId]);

  useEffect(() => {
    if (!socket) return undefined;

    const matchesScope = (payload) => {
      if (isDm) {
        return payload?.scope === 'dm' && String(payload?.userId) === String(dmUserId);
      }
      return payload?.scope === 'public';
    };

    const handleTyping = (payload) => {
      if (payload?.username === currentUsername) return;
      if (!matchesScope(payload)) return;
      setTypingUsers((prev) => (prev.includes(payload.username) ? prev : [...prev, payload.username]));
    };

    const handleStopTyping = (payload) => {
      if (!matchesScope(payload)) return;
      setTypingUsers((prev) => prev.filter((u) => u !== payload.username));
    };

    socket.on('typing', handleTyping);
    socket.on('stop_typing', handleStopTyping);

    return () => {
      socket.off('typing', handleTyping);
      socket.off('stop_typing', handleStopTyping);
    };
  }, [socket, currentUsername, isDm, dmUserId]);

  const notifyTyping = useCallback(() => {
    if (!socket) return;
    socket.emit('typing', isDm ? { recipientId: dmUserId } : undefined);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stop_typing', isDm ? { recipientId: dmUserId } : undefined);
    }, TYPING_TIMEOUT);
  }, [socket, isDm, dmUserId]);

  const notifyStopTyping = useCallback(() => {
    if (!socket) return;
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socket.emit('stop_typing', isDm ? { recipientId: dmUserId } : undefined);
  }, [socket, isDm, dmUserId]);

  return { typingUsers, notifyTyping, notifyStopTyping };
};
