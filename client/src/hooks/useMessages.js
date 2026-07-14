import { useCallback, useEffect, useState } from 'react';
import { fetchMessages, fetchConversation } from '../services/api';

// `conversation` is either { type: 'public' } or { type: 'dm', userId, username }.
// Loads history for whichever is active, and filters incoming socket events
// so only messages belonging to the open conversation get appended.
export const useMessages = (socket, conversation, currentUserId) => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const isDm = conversation?.type === 'dm';
  const dmUserId = conversation?.userId;

  const loadHistory = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = isDm ? await fetchConversation(dmUserId) : await fetchMessages();
      setMessages(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [isDm, dmUserId]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    if (!socket) return undefined;

    const belongsToCurrentView = (message) => {
      if (isDm) {
        if (!message.recipient) return false;
        const senderId = String(message.sender);
        const recipientId = String(message.recipient);
        const otherParty = senderId === String(currentUserId) ? recipientId : senderId;
        return otherParty === String(dmUserId);
      }
      return !message.recipient;
    };

    const handleReceive = (message) => {
      if (!belongsToCurrentView(message)) return;
      setMessages((prev) => {
        if (prev.some((m) => m._id === message._id)) return prev;
        return [...prev, message];
      });
    };

    const handleCleared = () => {
      if (!isDm) setMessages([]);
    };

    const handleDmCleared = (payload) => {
      if (!isDm) return;
      const participants = (payload?.participants || []).map(String);
      if (participants.includes(String(dmUserId)) && participants.includes(String(currentUserId))) {
        setMessages([]);
      }
    };

    socket.on('receive_message', handleReceive);
    socket.on('chat_cleared', handleCleared);
    socket.on('dm_cleared', handleDmCleared);

    return () => {
      socket.off('receive_message', handleReceive);
      socket.off('chat_cleared', handleCleared);
      socket.off('dm_cleared', handleDmCleared);
    };
  }, [socket, isDm, dmUserId, currentUserId]);

  return { messages, isLoading, error, reload: loadHistory };
};
