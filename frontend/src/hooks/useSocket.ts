import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { getSocketUrl } from '../lib/api';

// Singleton socket instance
let socketInstance: Socket | null = null;
let socketRefCount = 0;

function getOrCreateSocket(): Socket {
  if (!socketInstance || socketInstance.disconnected) {
    socketInstance = io(getSocketUrl(), {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    });
  }
  return socketInstance;
}

/**
 * Real Socket.IO hook providing a shared singleton connection.
 * Manages lifecycle: connects on first mount, disconnects when all consumers unmount.
 */
export function useSocket() {
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = getOrCreateSocket();
    socketRef.current = socket;
    socketRefCount++;

    const handleConnect = () => {
      setConnected(true);
      console.log('🔌 Socket connected');
    };

    const handleDisconnect = (reason: string) => {
      setConnected(false);
      console.log('🔌 Socket disconnected:', reason);
    };

    const handleConnectError = (error: Error) => {
      console.warn('⚠️ Socket connection error:', error.message);
      setConnected(false);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);

    // If already connected, update state immediately
    if (socket.connected) {
      setConnected(true);
    }

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);

      socketRefCount--;
      if (socketRefCount <= 0 && socketInstance) {
        socketInstance.disconnect();
        socketInstance = null;
        socketRefCount = 0;
      }
    };
  }, []);

  const emit = useCallback((event: string, data?: unknown) => {
    socketRef.current?.emit(event, data);
  }, []);

  const on = useCallback((event: string, cb: (data: unknown) => void) => {
    socketRef.current?.on(event, cb);
    return () => {
      socketRef.current?.off(event, cb);
    };
  }, []);

  const off = useCallback((event: string, cb?: (data: unknown) => void) => {
    if (cb) {
      socketRef.current?.off(event, cb);
    } else {
      socketRef.current?.off(event);
    }
  }, []);

  return {
    connected,
    socket: socketRef.current,
    emit,
    on,
    off,
  };
}
