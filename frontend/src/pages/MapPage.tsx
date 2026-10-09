import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useGeolocation } from '../hooks/useGeolocation';
import { useUserStore } from '../stores/useUserStore';

export default function MapPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useGeolocation();
  const profile = useUserStore((state) => state.profile);
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get('search');
  
  const [inputValue, setInputValue] = useState(searchQuery || '');

  useEffect(() => {
    if (searchQuery) {
      setInputValue(searchQuery);
    }
  }, [searchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      setSearchParams({ search: inputValue.trim() });
    } else {
      searchParams.delete('search');
      setSearchParams(searchParams);
    }
  };

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

  const mapSrc = useMemo(() => {
    // Embed API modes: search, place, directions without using API Key
    if (searchQuery) {
      const encodedQuery = encodeURIComponent(searchQuery);
      if (initialLoc) {
        // Force the map to STAY centered on the user's exact coordinates using 'll'
        // This prevents Google Maps from automatically flying away to another district
        return `https://maps.google.com/maps?q=${encodedQuery}&ll=${initialLoc.lat},${initialLoc.lng}&z=15&output=embed`;
      }
      return `https://maps.google.com/maps?q=${encodedQuery}&output=embed`;
    }
    
    // Default fallback to just showing the map at user's location (view mode)
    if (initialLoc) {
      return `https://maps.google.com/maps?q=${initialLoc.lat},${initialLoc.lng}&z=15&output=embed`;
    }

    return "";
  }, [searchQuery, initialLoc]);

  return (
    <div className="h-[100dvh] w-full bg-background relative flex flex-col">
      {/* Header */}
      <div className="z-10 bg-surface-container pt-safe-top pb-4 px-4 shadow-sm shrink-0">
        <div className="flex items-center gap-3 max-w-[390px] mx-auto">
          <button 
            onClick={() => navigate(-1)} 
            className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface shadow-sm shrink-0 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          
          <form 
            onSubmit={handleSearch}
            className="flex-1 h-12 bg-surface-container/80 backdrop-blur-md rounded-full px-4 flex items-center gap-3 border border-white/5 shadow-md"
          >
            <span className="material-symbols-outlined text-on-surface-variant">search</span>
            <input 
              type="text" 
              placeholder="Nhập tên quán hoặc món ăn..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="bg-transparent border-none text-on-surface font-body-md w-full outline-none placeholder:text-on-surface-variant/60"
            />
            {inputValue && (
              <button 
                type="button" 
                onClick={() => {
                  setInputValue('');
                  searchParams.delete('search');
                  setSearchParams(searchParams);
                }}
                className="w-6 h-6 rounded-full bg-on-surface-variant/20 flex items-center justify-center text-on-surface"
              >
                <span className="material-symbols-outlined text-[14px]">close</span>
              </button>
            )}
          </form>
        </div>
      </div>

      {/* Map Content */}
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
              <p className="text-error text-center p-6">
                Chưa có vị trí.
              </p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
