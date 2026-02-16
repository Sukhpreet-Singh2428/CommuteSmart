import { useEffect, useState } from 'react';

// Stub for socket.io real-time updates
// In production: import { io } from 'socket.io-client';
export function useSocket(_url?: string) {
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Stub: simulate connection
    const t = setTimeout(() => setConnected(true), 500);
    return () => clearTimeout(t);
  }, []);

  return {
    connected,
    emit: (_event: string, _data?: unknown) => {},
    on: (_event: string, _cb: (data: unknown) => void) => () => {},
  };
}
