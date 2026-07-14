import { useEffect, useState } from 'react';

export const useOnlineUsers = (socket) => {
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    if (!socket) return undefined;

    const handleOnlineUsers = (users) => setOnlineUsers(users);

    socket.on('online_users', handleOnlineUsers);

    return () => {
      socket.off('online_users', handleOnlineUsers);
    };
  }, [socket]);

  return onlineUsers;
};
