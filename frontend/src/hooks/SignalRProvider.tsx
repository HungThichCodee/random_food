import React, { createContext, useContext, useEffect, useState } from 'react';
import * as signalR from '@microsoft/signalr';
import { useUserStore } from '../stores/useUserStore';

const signalRUrl = import.meta.env.VITE_SIGNALR_URL;
if (!signalRUrl) throw new Error('VITE_SIGNALR_URL must be set in the root .env');
const API_BASE_URL = signalRUrl.replace(/\/$/, '');

interface SignalRContextType {
  matchHub: signalR.HubConnection | null;
  chatHub: signalR.HubConnection | null;
  isConnected: boolean;
}

const SignalRContext = createContext<SignalRContextType>({
  matchHub: null,
  chatHub: null,
  isConnected: false,
});

export const useSignalR = () => useContext(SignalRContext);

export function SignalRProvider({ children }: { children: React.ReactNode }) {
  const token = useUserStore((state) => state.profile?.token);
  const expiresAt = useUserStore((state) => state.profile?.expiresAt);

  const [matchHub, setMatchHub] = useState<signalR.HubConnection | null>(null);
  const [chatHub, setChatHub] = useState<signalR.HubConnection | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const expiration = Date.parse(expiresAt ?? '');
    if (!token || !Number.isFinite(expiration) || expiration <= Date.now()) {
      setIsConnected(false);
      setMatchHub(null);
      setChatHub(null);
      return;
    }
    setIsConnected(false);
    let disposed = false;
    let starting = false;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    const tokenIsValid = () => Date.now() < expiration;
    const options: signalR.IHttpConnectionOptions = {
      accessTokenFactory: () => token,
    };
    const reconnectPolicy: signalR.IRetryPolicy = {
      nextRetryDelayInMilliseconds: () => tokenIsValid() ? 5000 : null,
    };
    const newMatchHub = new signalR.HubConnectionBuilder()
      .withUrl(`${API_BASE_URL}/hubs/match`, options)
      .withAutomaticReconnect(reconnectPolicy)
      .configureLogging(signalR.LogLevel.Warning)
      .build();
    const newChatHub = new signalR.HubConnectionBuilder()
      .withUrl(`${API_BASE_URL}/hubs/chat`, options)
      .withAutomaticReconnect(reconnectPolicy)
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    const bothConnected = () =>
      newMatchHub.state === signalR.HubConnectionState.Connected &&
      newChatHub.state === signalR.HubConnectionState.Connected;
    const syncConnected = () => {
      if (disposed) return;
      const connected = bothConnected();
      setIsConnected(connected);
      if (connected && retryTimer) {
        clearTimeout(retryTimer);
        retryTimer = null;
      }
    };
    const scheduleRetry = () => {
      if (disposed || !tokenIsValid() || retryTimer) return;
      retryTimer = setTimeout(() => {
        retryTimer = null;
        void startConnections();
      }, 5000);
    };
    const startConnections = async () => {
      if (disposed || !tokenIsValid() || starting) return;
      starting = true;
      await Promise.allSettled([newMatchHub, newChatHub].map((hub) =>
        hub.state === signalR.HubConnectionState.Disconnected ? hub.start() : Promise.resolve()));
      starting = false;
      syncConnected();
      if (!bothConnected()) scheduleRetry();
    };

    for (const hub of [newMatchHub, newChatHub]) {
      hub.onreconnecting(syncConnected);
      hub.onreconnected(syncConnected);
      hub.onclose(() => {
        syncConnected();
        scheduleRetry();
      });
    }

    setMatchHub(newMatchHub);
    setChatHub(newChatHub);
    void startConnections();

    return () => {
      disposed = true;
      if (retryTimer) clearTimeout(retryTimer);
      void Promise.allSettled([newMatchHub.stop(), newChatHub.stop()]);
    };
  }, [token, expiresAt]);

  return (
    <SignalRContext.Provider value={{ matchHub, chatHub, isConnected }}>
      {children}
    </SignalRContext.Provider>
  );
}
