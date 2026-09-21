import type { ReactNode } from 'react';
import { MapContainer as LeafletMapContainer, TileLayer } from 'react-leaflet';
import { useTranslation } from 'react-i18next';

interface MapContainerProps {
  center?: [number, number];
  zoom?: number;
  children?: ReactNode;
}

export default function MapContainer({
  center = [10.7769, 106.7009],
  zoom = 14,
  children,
}: MapContainerProps) {
  const { t } = useTranslation();

  return (
    <div style={{ height: '100%', width: '100%' }}>
      {/* TODO: Leaflet MapContainer wrapper */}
      <LeafletMapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {children}
      </LeafletMapContainer>
    </div>
  );
}
