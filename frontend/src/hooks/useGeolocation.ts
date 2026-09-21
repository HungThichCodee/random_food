import { useState, useEffect } from 'react';

interface GeolocationState {
  lat: number | null;
  lng: number | null;
  error: string | null;
  isLoading: boolean;
}

/// Custom hook for browser Geolocation API
export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    lat: null,
    lng: null,
    error: null,
    isLoading: true,
  });

  useEffect(() => {
    // TODO: Implement geolocation watching
    // 1. Check if navigator.geolocation is available
    // 2. Request permission
    // 3. Watch position changes
    // 4. Update state
    setState((prev) => ({ ...prev, isLoading: false, error: 'Not implemented' }));
  }, []);

  return state;
}
