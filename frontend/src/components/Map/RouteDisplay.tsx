import { Polyline } from 'react-leaflet';
import { useTranslation } from 'react-i18next';
import type { LatLngExpression } from 'leaflet';

interface RouteDisplayProps {
  coordinates: number[][];
}

export default function RouteDisplay({ coordinates }: RouteDisplayProps) {
  const { t } = useTranslation();

  const positions = coordinates.map(([lat, lng]) => [lat, lng] as [number, number]) as LatLngExpression[];

  return (
    // TODO: Leaflet Polyline for route between two points
    <Polyline positions={positions} color="#ff6b35" weight={5} opacity={0.7} />
  );
}
