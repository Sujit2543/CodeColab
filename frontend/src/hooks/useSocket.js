import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

// Production: VITE_SOCKET_URL = https://your-backend.onrender.com
// Local dev:  http://localhost:5000
const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export function useSocket() {
  const socketRef = useRef(null);

  const connect = () => {
    const token = localStorage.getItem('cc_token');
    if (!token) return null;

    if (!socketRef.current || !socketRef.current.connected) {
      socketRef.current = io(SOCKET_URL, {
        auth: { token },
        // Use polling first then upgrade — more reliable on Render free tier
        transports: ['polling', 'websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 20000,
      });
    }
    return socketRef.current;
  };

  const disconnect = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  return { socketRef, connect, disconnect };
}
