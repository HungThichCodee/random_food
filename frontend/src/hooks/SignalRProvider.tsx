import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import * as signalR from '@microsoft/signalr';
import { useUserStore } from '../stores/useUserStore';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface SignalRContextType {
  locationHub: signalR.HubConnection | null;
  matchHub: signalR.HubConnection | null;
  chatHub: signalR.HubConnection | null;
  isConnected: boolean;
}

const SignalRContext = createContext<SignalRContextType>({
  locationHub: null,
  matchHub: null,
  chatHub: null,
  isConnected: false,
});

export const useSignalR = () => useContext(SignalRContext);

export function SignalRProvider({ children }: { children: React.ReactNode }) {
  const { profile } = useUserStore();
  const tokenRef = useRef<string | null>(null);

  const [locationHub, setLocationHub] = useState<signalR.HubConnection | null>(null);
  const [matchHub, setMatchHub] = useState<signalR.HubConnection | null>(null);
  const [chatHub, setChatHub] = useState<signalR.HubConnection | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const currentToken = profile?.token || null;
    
    // Don't reconnect if token hasn't actually changed
    if (currentToken === tokenRef.current) return;
    tokenRef.current = currentToken;

    if (!currentToken) {
      setIsConnected(false);
      // Stop existing connections
      locationHub?.stop();
      matchHub?.stop();
      chatHub?.stop();
      setLocationHub(null);
      setMatchHub(null);
      setChatHub(null);
      return;
    }

    const options: signalR.IHttpConnectionOptions = {
      accessTokenFactory: () => currentToken,
    };

    const newLocationHub = new signalR.HubConnectionBuilder()
      .withUrl(`${API_BASE_URL}/hubs/location`, options)
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    const newMatchHub = new signalR.HubConnectionBuilder()
      .withUrl(`${API_BASE_URL}/hubs/match`, options)
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    const newChatHub = new signalR.HubConnectionBuilder()
      .withUrl(`${API_BASE_URL}/hubs/chat`, options)
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    const startConnections = async () => {
      try {
        await Promise.all([
          newLocationHub.start(),
          newMatchHub.start(),
          newChatHub.start(),
        ]);
        console.log('[SignalR] All hubs connected successfully');
        setIsConnected(true);
      } catch (err) {
        console.error('[SignalR] Error connecting to hubs:', err);
        setIsConnected(false);
      }
    };

    setLocationHub(newLocationHub);
    setMatchHub(newMatchHub);
    setChatHub(newChatHub);

    startConnections();

    return () => {
      console.log('[SignalR] Cleaning up hub connections');
      newLocationHub.stop();
      newMatchHub.stop();
      newChatHub.stop();
    };
  }, [profile?.token]);

  return (
    <SignalRContext.Provider value={{ locationHub, matchHub, chatHub, isConnected }}>
      {children}
    </SignalRContext.Provider>
  );
}
