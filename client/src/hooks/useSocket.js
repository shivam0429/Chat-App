import { useEffect, useRef, useState, useCallback } from 'react';
import { getSocket } from '../services/socket';

export const useSocket = (token) => {
  const socketRef = useRef(getSocket(token));
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);

  useEffect(() => {
    const socket = socketRef.current;

    if (!token) return undefined;

    socket.auth = { token };

    if (!socket.connected) {
      socket.connect();
    }

    const handleConnect = () => {
      setIsConnected(true);
      setIsReconnecting(false);
    };

    const handleDisconnect = () => setIsConnected(false);
    const handleReconnectAttempt = () => setIsReconnecting(true);
    const handleReconnect = () => setIsReconnecting(false);
    const handleConnectError = () => setIsConnected(false);

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('reconnect_attempt', handleReconnectAttempt);
    socket.on('reconnect', handleReconnect);
    socket.on('connect_error', handleConnectError);

    if (socket.connected) {
      handleConnect();
    }

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('reconnect_attempt', handleReconnectAttempt);
      socket.off('reconnect', handleReconnect);
      socket.off('connect_error', handleConnectError);

      // Disconnect on cleanup so the server immediately marks this
      // user offline instead of leaving a stale "ghost" entry behind.
      socket.disconnect();
    };
  }, [token]);

  const emit = useCallback((event, payload, callback) => {
    socketRef.current.emit(event, payload, callback);
  }, []);

  return { socket: socketRef.current, isConnected, isReconnecting, emit };
};
