import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useGeolocation } from '../hooks/useGeolocation';
import { useUserStore } from '../stores/useUserStore';

export default function DirectionRoutePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const locationState = useLocation();
  const location = useGeolocation();
  const profile = useUserStore((state) => state.profile);

  const [initialLoc, setInitialLoc] = useState<{lat: number, lng: number} | null>(null);

  useEffect(() => {
    if (!initialLoc) {
      if (profile?.currentLat && profile?.currentLng) {
        setInitialLoc({ lat: profile.currentLat, lng: profile.currentLng });
      } else if (location.lat && location.lng) {
        setInitialLoc({ lat: location.lat, lng: location.lng });
      }
    }
  }, [location.lat, location.lng, profile?.currentLat, profile?.currentLng, initialLoc]);

  // For routing to a buddy or a restaurant
  // Could be coordinates (destLat, destLng) or a place name
  const destLat = locationState.state?.lat;
  const destLng = locationState.state?.lng;
  const destName = locationState.state?.name || 'Điểm đến';
  const destQuery = locationState.state?.query;

  const mapSrc = useMemo(() => {
    if (initialLoc) {
      const origin = `${initialLoc.lat},${initialLoc.lng}`;
      let destination = "";
      
      if (destLat && destLng) {
        destination = `${destLat},${destLng}`;
      } else if (destQuery) {
        destination = encodeURIComponent(destQuery);
      }

      if (destination) {
        return `https://maps.google.com/maps?saddr=${origin}&daddr=${destination}&output=embed`;
      }
    }
    return "";
  }, [initialLoc, destLat, destLng, destQuery]);

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
      </div>

      <div className="flex-1 w-full relative">
        {(!location.lat || !location.lng) && location.isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background z-20">
            <span className="material-symbols-outlined text-4xl text-primary animate-spin mb-4">progress_activity</span>
            <p className="text-on-surface-variant text-body-md">Đang lấy vị trí của bạn...</p>
          </div>
        )}
        
        {mapSrc ? (
          <iframe
            src={mapSrc}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen={false}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="absolute inset-0"
          ></iframe>
        ) : (
          !location.isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background z-20">
              <p className="text-error text-center p-6 bg-surface-container rounded-2xl mx-6">
                Chưa có vị trí hiện tại hoặc điểm đến không hợp lệ.
              </p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
