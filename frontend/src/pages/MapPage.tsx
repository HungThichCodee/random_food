import { useTranslation } from 'react-i18next';

export default function MapPage() {
  const { t } = useTranslation();

  return (
    <div style={{ height: 'calc(100vh - 64px)' }}>
      <h2>{t('nav.map')}</h2>
      {/* TODO: MapContainer with Leaflet */}
      {/* TODO: Restaurant markers */}
      {/* TODO: User markers (when findBuddy mode) */}
      {/* TODO: RouteDisplay (after match accepted) */}
      {/* TODO: Control panel (search radius, filters) */}
    </div>
  );
}
