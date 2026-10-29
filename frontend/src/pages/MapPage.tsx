import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useGeolocation } from '../hooks/useGeolocation';
import { useUserStore } from '../stores/useUserStore';
import { searchMapUrl, viewMapUrl } from '../utils/mapsEmbed';

const quickSearches = ['Quán ăn', 'Cà phê', 'Món chay'];

export default function MapPage() {
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

  const livePosition = location.lat != null && location.lng != null &&
    Number.isFinite(location.lat) && Number.isFinite(location.lng);
  const savedPosition = profile?.currentLat != null && profile.currentLng != null &&
    Number.isFinite(profile.currentLat) && Number.isFinite(profile.currentLng);
  const currentLat = livePosition ? location.lat : savedPosition ? profile.currentLat : null;
  const currentLng = livePosition ? location.lng : savedPosition ? profile.currentLng : null;

  const mapSrc = useMemo(() => {
    const center = currentLat != null && currentLng != null
      ? { lat: currentLat, lng: currentLng } : null;
    return searchQuery ? searchMapUrl(searchQuery, center) : viewMapUrl(center);
  }, [searchQuery, currentLat, currentLng]);

  return (
    <main className="h-[100dvh] w-full bg-background relative flex flex-col">
      {/* Header */}
      <div className="z-10 bg-surface-container pt-safe-top pb-4 px-4 shadow-sm shrink-0">
        <div className="flex items-center gap-3 max-w-[390px] mx-auto">
          <button 
            onClick={() => navigate(-1)} 
            aria-label="Quay lại"
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
                aria-label="Xóa tìm kiếm"
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
        <div className="mx-auto mt-3 flex max-w-[390px] gap-2 overflow-x-auto pb-1" role="group" aria-label="Tìm nhanh trên bản đồ">
          {quickSearches.map((term) => (
            <button key={term} type="button" onClick={() => {
              setInputValue(term);
              setSearchParams({ search: term });
            }} aria-pressed={searchQuery === term}
              className={`min-h-10 shrink-0 rounded-full px-3 text-sm font-semibold ${searchQuery === term
                ? 'bg-primary-container text-white' : 'bg-surface-container-high text-on-surface-variant'}`}>
              {term}
            </button>
          ))}
        </div>
        <p className="mx-auto mt-1 max-w-[390px] text-xs text-on-surface-variant">
          Google Maps nhận vị trí đang dùng để hiển thị bản đồ.
        </p>
      </div>

      {/* Map Content */}
      <div className="flex-1 w-full relative">
        {mapSrc && !location.isLoading && !livePosition && savedPosition && (
          <p role="status" className="absolute top-3 inset-x-3 z-20 rounded-xl bg-surface-container-high/95 px-3 py-2 text-body-sm text-on-surface shadow-lg">
            GPS chưa khả dụng. Bản đồ đang dùng vị trí đã lưu, có thể không còn là vị trí hiện tại.
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
            title={searchQuery ? `Tìm ${searchQuery} trên Google Maps` : 'Vị trí của tôi trên Google Maps'}
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
              <p className="text-error text-center p-6">
                Chưa có vị trí.
              </p>
            </div>
          )
        )}
      </div>
    </main>
  );
}
