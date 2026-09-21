import { Marker, Popup } from 'react-leaflet';
import { Button } from 'antd';
import { useTranslation } from 'react-i18next';
import type { TempUserDto } from '../../types/tempUser';

interface UserMarkerPopupProps {
  user: TempUserDto;
  onInvite?: (userId: string) => void;
}

export default function UserMarkerPopup({ user, onInvite }: UserMarkerPopupProps) {
  const { t } = useTranslation();

  if (user.currentLat == null || user.currentLng == null) {
    return null;
  }

  return (
    // TODO: Leaflet Marker + Popup for nearby user. Has invite button.
    <Marker position={[user.currentLat, user.currentLng]}>
      <Popup>
        <div>
          <h4>{user.displayName}</h4>
          {user.desiredFood && <p>{t('profile.desiredFood')}: {user.desiredFood}</p>}
          <Button
            type="primary"
            size="small"
            onClick={() => onInvite?.(user.id)}
          >
            {t('match.invite')}
          </Button>
        </div>
      </Popup>
    </Marker>
  );
}
