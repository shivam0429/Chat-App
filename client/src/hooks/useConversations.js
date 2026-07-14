import { useCallback, useEffect, useState } from 'react';
import { fetchUsers } from '../services/api';

// Loads the list of other registered users (for starting/continuing a DM)
// and tracks an unread-message badge count per user while a different
// conversation is open.
export const useConversations = (socket, currentUserId, activeConversation) => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCounts, setUnreadCounts] = useState({});

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      try {
        const data = await fetchUsers();
        if (!cancelled) setUsers(data);
      } catch {
        if (!cancelled) setUsers([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!socket || !currentUserId) return undefined;

    const handleReceive = (message) => {
      if (!message.recipient) return; // public message, no DM badge

      const senderId = String(message.sender);
      if (senderId === String(currentUserId)) return; // sent by me, no badge needed

      const isCurrentlyOpen =
        activeConversation?.type === 'dm' && String(activeConversation.userId) === senderId;
      if (isCurrentlyOpen) return;

      setUnreadCounts((prev) => ({
        ...prev,
        [senderId]: (prev[senderId] || 0) + 1,
      }));
    };

    socket.on('receive_message', handleReceive);
    return () => socket.off('receive_message', handleReceive);
  }, [socket, currentUserId, activeConversation]);

  const clearUnread = useCallback((userId) => {
    setUnreadCounts((prev) => {
      if (!prev[userId]) return prev;
      const next = { ...prev };
      delete next[userId];
      return next;
    });
  }, []);

  return { users, isLoading, unreadCounts, clearUnread };
};
