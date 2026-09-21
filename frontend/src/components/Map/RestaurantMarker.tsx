import { Marker } from 'react-leaflet';
import { useTranslation } from 'react-i18next';
import type { RestaurantDto } from '../../types/restaurant';
import RestaurantPopup from './RestaurantPopup';

interface RestaurantMarkerProps {
  restaurant: RestaurantDto;
}

export default function RestaurantMarker({ restaurant }: RestaurantMarkerProps) {
  const { t } = useTranslation();

  return (
    // TODO: Leaflet Marker for restaurant
    <Marker position={[restaurant.lat, restaurant.lng]}>
      <RestaurantPopup restaurant={restaurant} />
    </Marker>
  );
}
