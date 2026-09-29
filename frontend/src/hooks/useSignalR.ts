import { useEffect, useRef, useState } from 'react';
import * as signalR from '@microsoft/signalr';
import { useUserStore } from '../stores/useUserStore';

const API_BASE_URL = 'https://localhost:7154'; // Or read from env

export const useSignalR = () => {
  const { profile } = useUserStore();
  
  const [locationHub, setLocationHub] = useState<signalR.HubConnection | null>(null);
  const [matchHub, setMatchHub] = useState<signalR.HubConnection | null>(null);
  const [chatHub, setChatHub] = useState<signalR.HubConnection | null>(null);
  
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!profile?.token) {
      setIsConnected(false);
      return;
    }

    const options: signalR.IHttpConnectionOptions = {
      accessTokenFactory: () => profile.token
    };

    // Initialize Hubs
    const newLocationHub = new signalR.HubConnectionBuilder()
      .withUrl(`${API_BASE_URL}/hubs/location`, options)
      .withAutomaticReconnect()
      .build();

    const newMatchHub = new signalR.HubConnectionBuilder()
      .withUrl(`${API_BASE_URL}/hubs/match`, options)
      .withAutomaticReconnect()
      .build();

    const newChatHub = new signalR.HubConnectionBuilder()
      .withUrl(`${API_BASE_URL}/hubs/chat`, options)
      .withAutomaticReconnect()
      .build();

    const startConnections = async () => {
      try {
        await Promise.all([
          newLocationHub.start(),
          newMatchHub.start(),
          newChatHub.start()
        ]);
        console.log('SignalR Hubs connected');
        setIsConnected(true);
      } catch (err) {
        console.error('Error connecting to SignalR Hubs:', err);
      }
    };

    startConnections();

    setLocationHub(newLocationHub);
    setMatchHub(newMatchHub);
    setChatHub(newChatHub);

    return () => {
      newLocationHub.stop();
      newMatchHub.stop();
      newChatHub.stop();
    };
  }, [profile?.token]);

  return {
    locationHub,
    matchHub,
    chatHub,
    isConnected
  };
};
