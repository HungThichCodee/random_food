import { useEffect, useRef } from 'react';

/// Custom hook for SignalR connection management
export function useSignalR(hubUrl: string) {
  const connectionRef = useRef<unknown>(null);

  useEffect(() => {
    // TODO: Implement SignalR connection
    // 1. Create HubConnectionBuilder
    // 2. Configure transport (WebSocket with LongPolling fallback)
    // 3. Start connection
    // 4. Handle reconnection
    // 5. Cleanup on unmount
    return () => {
      // Cleanup
    };
  }, [hubUrl]);

  return {
    connection: connectionRef.current,
    // TODO: Add methods: invoke, on, off
  };
}
