import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGeolocation } from '../hooks/useGeolocation';
import { useUserStore } from '../stores/useUserStore';
import { useSignalR } from '../hooks/useSignalR';
import { matchApi } from '../api/matchApi';
import type { MatchRequestDto } from '../types/match';
import { directionsMapUrl, hasMapsEmbedKey, type MapPoint, type TravelMode } from '../utils/mapsEmbed';

export default function DirectionRoutePage() {
  const navigate = useNavigate();
  const locationState = useLocation();
  const location = useGeolocation();
  const profile = useUserStore((state) => state.profile);
  const { matchHub } = useSignalR();
  const privateMatchId =
    typeof locationState.state?.privateMatchId === 'number' &&
    Number.isInteger(locationState.state.privateMatchId)
      ? locationState.state.privateMatchId as number
      : null;
  const showMeetingPlace = locationState.state?.meetingPlace === true;
  const [buddyDestination, setBuddyDestination] = useState<{ lat: number; lng: number } | null>(null);
  const [accessChecked, setAccessChecked] = useState(false);
  const [travelMode, setTravelMode] = useState<TravelMode>('walking');

  const livePosition = location.lat != null && location.lng != null &&
    Number.isFinite(location.lat) && Number.isFinite(location.lng);
  const savedPosition = profile?.currentLat != null && profile.currentLng != null &&
    Number.isFinite(profile.currentLat) && Number.isFinite(profile.currentLng);
  const currentLat = livePosition ? location.lat : savedPosition ? profile.currentLat : null;
  const currentLng = livePosition ? location.lng : savedPosition ? profile.currentLng : null;

  useEffect(() => {
    if (privateMatchId === null) return;
    let mounted = true;
    const applyMatch = (match: MatchRequestDto) => {
      if (!mounted) return;
      const buddyAllowed = match.id === privateMatchId &&
        match.status === 'Accepted' &&
        match.buddyHasSharedLocation &&
        typeof match.buddyLat === 'number' && Number.isFinite(match.buddyLat) &&
        typeof match.buddyLng === 'number' && Number.isFinite(match.buddyLng);
      const allowed = showMeetingPlace
        ? buddyAllowed && match.hasSharedLocation && Boolean(match.meetingPlace)
        : buddyAllowed;
      const destination = showMeetingPlace
        ? match.meetingPlace
        : { lat: match.buddyLat, lng: match.buddyLng };
      setBuddyDestination(allowed &&
        typeof destination?.lat === 'number' && Number.isFinite(destination.lat) &&
        typeof destination?.lng === 'number' && Number.isFinite(destination.lng)
        ? { lat: destination.lat, lng: destination.lng } : null);
      setAccessChecked(true);
    };
    const refresh = async () => {
      try {
        applyMatch(await matchApi.getById(privateMatchId));
      } catch {
        if (mounted) {
          setBuddyDestination(null);
          setAccessChecked(true);
        }
      }
    };
    const onSharingChanged = (match: MatchRequestDto) => applyMatch(match);
    void refresh();
    const interval = window.setInterval(refresh, 10000);
    matchHub?.on('LocationSharingUpdated', onSharingChanged);
    return () => {
      mounted = false;
      window.clearInterval(interval);
      matchHub?.off('LocationSharingUpdated', onSharingChanged);
    };
  }, [privateMatchId, showMeetingPlace, matchHub]);

  // For routing to a buddy or a restaurant
  // Could be coordinates (destLat, destLng) or a place name
  const destLat = privateMatchId === null ? locationState.state?.lat : buddyDestination?.lat;
  const destLng = privateMatchId === null ? locationState.state?.lng : buddyDestination?.lng;
  const destName = locationState.state?.name || 'Điểm đến';
  const destQuery = locationState.state?.query;

  const mapSrc = useMemo(() => {
    const origin: MapPoint | null = currentLat != null && currentLng != null
      ? { lat: currentLat, lng: currentLng } : null;
    const destination: MapPoint | string | null =
      typeof destLat === 'number' && typeof destLng === 'number'
        ? { lat: destLat, lng: destLng }
        : privateMatchId === null && typeof destQuery === 'string' ? destQuery : null;
    return directionsMapUrl(origin, destination, travelMode);
  }, [currentLat, currentLng, destLat, destLng, destQuery, privateMatchId, travelMode]);

  return (
    <div className="h-[100dvh] w-full bg-background relative flex flex-col">
      <div className="z-10 bg-surface-container pt-safe-top pb-4 px-4 shadow-sm shrink-0">
        <div className="flex items-center gap-3 max-w-[390px] mx-auto pointer-events-auto">
          <button 
            onClick={() => navigate(-1)} 
            className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface shadow-sm shrink-0 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>
          
          <div className="flex-1 h-12 bg-surface-container-high rounded-full px-4 flex items-center gap-3 shadow-sm">
            <span className="material-symbols-outlined text-primary">directions_car</span>
            <span className="text-on-surface font-title-sm truncate font-bold">
              Đường tới {destName}
            </span>
          </div>
        </div>
        {hasMapsEmbedKey && (
          <div className="mx-auto mt-3 flex max-w-[390px] gap-2" role="group" aria-label="Phương tiện di chuyển">
            {([['walking', 'Đi bộ'], ['driving', 'Lái xe']] as const).map(([mode, label]) => (
              <button key={mode} type="button" onClick={() => setTravelMode(mode)}
                aria-pressed={travelMode === mode}
                className={`min-h-10 flex-1 rounded-full px-3 text-sm font-semibold ${travelMode === mode
                  ? 'bg-primary-container text-white' : 'bg-surface-container-high text-on-surface-variant'}`}>
                {label}
              </button>
            ))}
          </div>
        )}
        <p className="mx-auto mt-2 max-w-[390px] text-xs text-on-surface-variant">
          Google Maps nhận điểm xuất phát và điểm đến để hiển thị đường.
        </p>
      </div>

      <div className="flex-1 w-full relative">
        {mapSrc && !location.isLoading && !livePosition && savedPosition && (
          <p role="status" className="absolute top-3 inset-x-3 z-20 rounded-xl bg-surface-container-high/95 px-3 py-2 text-body-sm text-on-surface shadow-lg">
            GPS chưa khả dụng. Đường đi đang xuất phát từ vị trí đã lưu, có thể không còn chính xác.
          </p>
        )}
        {(location.lat == null || location.lng == null) && location.isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background z-20">
            <span className="material-symbols-outlined text-4xl text-primary animate-spin mb-4">progress_activity</span>
            <p className="text-on-surface-variant text-body-md">Đang lấy vị trí của bạn...</p>
          </div>
        )}
        
        {mapSrc ? (
          <iframe
            src={mapSrc}
            title={`Đường tới ${destName} trên Google Maps`}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
            className="absolute inset-0"
          ></iframe>
        ) : (
          !location.isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background z-20">
              <p className="text-error text-center p-6 bg-surface-container rounded-2xl mx-6">
                {privateMatchId !== null
                  ? accessChecked
                    ? 'Chỉ xem được đường tới người kia khi họ còn chia sẻ vị trí.'
                    : 'Đang kiểm tra quyền chia sẻ vị trí...'
                  : 'Chưa có vị trí hiện tại hoặc điểm đến không hợp lệ.'}
              </p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
