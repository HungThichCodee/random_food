export type MapPoint = { lat: number; lng: number };
export type TravelMode = 'walking' | 'driving' | 'bicycling' | 'transit';

const apiKey = __GOOGLE_MAPS_EMBED_API_KEY__.trim();

export const hasMapsEmbedKey = apiKey.length > 0;

function coordinates(point: MapPoint | null): string | null {
  if (!point || !Number.isFinite(point.lat) || !Number.isFinite(point.lng) ||
      Math.abs(point.lat) > 90 || Math.abs(point.lng) > 180) return null;
  // Preserve the measured numbers; do not round or offset either coordinate.
  return `${point.lat},${point.lng}`;
}

function officialUrl(mode: 'search' | 'view' | 'directions' | 'place' | 'streetview'): URL {
  const url = new URL(`https://www.google.com/maps/embed/v1/${mode}`);
  url.searchParams.set('key', apiKey);
  url.searchParams.set('language', 'vi');
  return url;
}

export function searchMapUrl(query: string, center: MapPoint | null): string {
  const term = query.trim();
  if (!term) return '';
  const centerText = coordinates(center);
  if (hasMapsEmbedKey) {
    const url = officialUrl('search');
    url.searchParams.set('q', term);
    if (centerText) {
      url.searchParams.set('center', centerText);
      url.searchParams.set('zoom', '15');
    }
    return url.toString();
  }
  return `https://maps.google.com/maps?q=${encodeURIComponent(term)}` +
    (centerText ? `&ll=${centerText}&z=15` : '') + '&output=embed';
}

export function viewMapUrl(center: MapPoint | null): string {
  const centerText = coordinates(center);
  if (!centerText) return '';
  if (hasMapsEmbedKey) {
    const url = officialUrl('view');
    url.searchParams.set('center', centerText);
    url.searchParams.set('zoom', '15');
    return url.toString();
  }
  return `https://maps.google.com/maps?q=${centerText}&z=15&output=embed`;
}

export function placeMapUrl(query: string, center: MapPoint | null): string {
  const term = query.trim();
  if (!term) return '';
  if (hasMapsEmbedKey) {
    const url = officialUrl('place');
    url.searchParams.set('q', term);
    const centerText = coordinates(center);
    if (centerText) {
      url.searchParams.set('center', centerText);
      url.searchParams.set('zoom', '15');
    }
    return url.toString();
  }
  return searchMapUrl(term, center);
}

export function streetViewMapUrl(center: MapPoint | null): string {
  const location = coordinates(center);
  if (!hasMapsEmbedKey || !location) return '';
  const url = officialUrl('streetview');
  url.searchParams.set('location', location);
  return url.toString();
}

export function directionsMapUrl(origin: MapPoint | string | null, destination: MapPoint | string | null,
  travelMode: TravelMode): string {
  const originText = typeof origin === 'string' ? origin.trim() : coordinates(origin);
  const destinationText = typeof destination === 'string'
    ? destination.trim() : coordinates(destination);
  if (!originText || !destinationText) return '';
  if (hasMapsEmbedKey) {
    const url = officialUrl('directions');
    url.searchParams.set('origin', originText);
    url.searchParams.set('destination', destinationText);
    url.searchParams.set('mode', travelMode);
    url.searchParams.set('units', 'metric');
    return url.toString();
  }
  return `https://maps.google.com/maps?saddr=${originText}` +
    `&daddr=${encodeURIComponent(destinationText)}&output=embed`;
}
