/// Offset coordinates by random meters for privacy
export function offsetLocation(lat: number, lng: number, _maxMeters: number = 50): [number, number] {
  // TODO: Implement random offset
  return [lat, lng];
}

/// Calculate distance between two coordinates (Haversine formula)
export function calculateDistance(_lat1: number, _lng1: number, _lat2: number, _lng2: number): number {
  // TODO: Implement Haversine
  return 0;
}

/// Format distance for display
export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)}m`;
  return `${km.toFixed(1)}km`;
}
