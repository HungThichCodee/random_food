import { Popup } from 'react-leaflet';
import { Button } from 'antd';
import { useTranslation } from 'react-i18next';
import type { RestaurantDto } from '../../types/restaurant';

interface RestaurantPopupProps {
  restaurant: RestaurantDto;
}

export default function RestaurantPopup({ restaurant }: RestaurantPopupProps) {
  const { t } = useTranslation();

  return (
    // TODO: Leaflet Popup for restaurant info
    <Popup>
      <div>
        <h4>{restaurant.name}</h4>
        {restaurant.address && <p>{restaurant.address}</p>}
        {restaurant.isInMall && <p>{restaurant.mallName}</p>}
        <Button type="primary" size="small">
          {t('map.getDirections')}
        </Button>
      </div>
    </Popup>
  );
}
