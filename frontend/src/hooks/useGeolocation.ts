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
    if (!navigator.geolocation) {
      setState({
        lat: 10.776889, // Default to HCM city
        lng: 106.700806,
        error: 'Geolocation is not supported by your browser',
        isLoading: false,
      });
      return;
    }

    const success = (position: GeolocationPosition) => {
      setState({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        error: null,
        isLoading: false,
      });
    };

    const handleError = (error: GeolocationPositionError) => {
      setState({
        lat: 10.776889, // Default to HCM city
        lng: 106.700806,
        error: error.message,
        isLoading: false,
      });
    };

    // Get initial position
    navigator.geolocation.getCurrentPosition(success, handleError, {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0
    });

    // Watch position
    const watchId = navigator.geolocation.watchPosition(success, handleError, {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0
    });

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  return state;
}
