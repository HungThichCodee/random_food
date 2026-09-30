import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MapContainer, TileLayer, Marker, useMap, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useGeolocation } from '../hooks/useGeolocation';
import { restaurantApi } from '../api/restaurantApi';
import type { RestaurantDto } from '../types/restaurant';
import { tempUserApi } from '../api/tempUserApi';
import { useUserStore } from '../stores/useUserStore';
import type { TempUserDto } from '../types/tempUser';
import { matchApi } from '../api/matchApi';
import { useSignalR } from '../hooks/useSignalR';
import logoImg from '../assert/logo.png';

// Recenter Map Helper
const RecenterMap = ({ lat, lng }: { lat: number; lng: number }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom());
  }, [lat, lng, map]);
  return null;
};

// Stitch Custom User Location Marker (Pulsing Teal Dot)
const createUserIcon = () => {
  return L.divIcon({
    className: 'custom-user-marker',
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; width: 64px; height: 64px; transform: translate(-8px, -8px);">
        <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 48px; height: 48px;">
          <div style="position: absolute; width: 48px; height: 48px; border-radius: 50%; background-color: rgba(79,219,204,0.25); animation: userPing 1.6s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="position: absolute; width: 28px; height: 28px; border-radius: 50%; background-color: rgba(0,177,163,0.35); filter: blur(2px);"></div>
          <div style="position: relative; width: 16px; height: 16px; border-radius: 50%; background-color: #4fdbcc; border: 3px solid #111319; box-shadow: 0 0 18px #4fdbcc;"></div>
        </div>
        <div style="margin-top: 2px; padding: 2px 8px; border-radius: 9999px; background: rgba(12,14,20,0.92); backdrop-filter: blur(8px); box-shadow: 0 2px 8px rgba(0,0,0,0.5); border: 1px solid rgba(79,219,204,0.3); white-space: nowrap;">
          <span style="font-size: 10px; font-weight: 800; color: #4fdbcc; font-family: 'Be Vietnam Pro', sans-serif;">Bạn ở đây</span>
        </div>
      </div>
      <style>
        @keyframes userPing {
          75%, 100% { transform: scale(2.2); opacity: 0; }
        }
      </style>
    `,
    iconSize: [64, 64],
    iconAnchor: [32, 32],
  });
};

// Stitch Custom Restaurant Marker (Neon Glass Aura Pin)
const createRestaurantIcon = (r: RestaurantDto, isActive: boolean) => {
  const emoji = r.isBuffet ? '🍲' : '🥖';
  const color = r.isBuffet ? '#4fdbcc' : '#ffe256';
  const shadow = r.isBuffet ? 'rgba(79,219,204,0.5)' : 'rgba(227,198,51,0.5)';
  
  if (isActive) {
    return L.divIcon({
      className: 'custom-restaurant-marker-active',
      html: `
        <div style="display: flex; flex-direction: column; align-items: center; animation: activeBounce 1.2s infinite alternate ease-in-out; transform: translateY(-10px);">
          <div style="padding: 2px 8px; border-radius: 9999px; background-color: rgba(17,19,25,0.95); border: 1px solid #ff6b35; box-shadow: 0 0 14px rgba(255,107,53,0.5); margin-bottom: 4px; white-space: nowrap;">
            <span style="font-size: 11px; color: #ffdbd0; font-weight: 800; font-family: 'Be Vietnam Pro', sans-serif;">${r.name.substring(0, 14)}</span>
          </div>
          <div style="width: 44px; height: 44px; border-radius: 50%; background-color: #ff6b35; box-shadow: 0 0 24px #ff6b35; display: flex; align-items: center; justify-content: center; font-size: 22px;">
            ${emoji}
          </div>
          <div style="width: 10px; height: 10px; transform: rotate(45deg); background-color: #ff6b35; margin-top: -5px; box-shadow: 0 4px 6px rgba(0,0,0,0.3);"></div>
        </div>
        <style>
          @keyframes activeBounce {
            0% { transform: translateY(0); }
            100% { transform: translateY(-8px); }
          }
        </style>
      `,
      iconSize: [120, 80],
      iconAnchor: [60, 75],
    });
  }

  return L.divIcon({
    className: 'custom-restaurant-marker',
    html: `
      <div style="display: flex; flex-direction: column; align-items: center; cursor: pointer; transition: transform 0.2s;">
        <div style="padding: 2px 8px; border-radius: 9999px; background-color: rgba(30,31,38,0.9); backdrop-filter: blur(8px); margin-bottom: 4px; box-shadow: 0 4px 8px rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.08); white-space: nowrap;">
          <span style="font-size: 10px; color: ${color}; font-weight: 700; font-family: 'Be Vietnam Pro', sans-serif;">${emoji} ${r.name.substring(0, 10)}</span>
        </div>
        <div style="width: 38px; height: 38px; border-radius: 50%; background-color: #282a30; box-shadow: 0 0 16px ${shadow}; border: 1.5px solid rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: center; font-size: 18px;">
          ${emoji}
        </div>
        <div style="width: 8px; height: 8px; transform: rotate(45deg); background-color: #282a30; margin-top: -4px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);"></div>
      </div>
    `,
    iconSize: [100, 70],
    iconAnchor: [50, 65],
  });
};

// Other User Marker (Buddies looking for food)
const createOtherUserIcon = (user: TempUserDto) => {
  const emoji = user.gender === 'Female' ? '👩' : user.gender === 'Male' ? '👨' : '👤';
  return L.divIcon({
    className: 'custom-other-user-marker',
    html: `
      <div style="display: flex; flex-direction: column; align-items: center; cursor: pointer;">
        <div style="padding: 2px 8px; border-radius: 9999px; background-color: rgba(17,19,25,0.92); border: 1px solid rgba(255,107,53,0.3); margin-bottom: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.4); white-space: nowrap;">
          <span style="font-size: 10px; color: #ffb59d; font-weight: 700;">${user.displayName}</span>
        </div>
        <div style="width: 34px; height: 34px; border-radius: 50%; background-color: #ff6b35; box-shadow: 0 0 14px rgba(255,107,53,0.5); display: flex; align-items: center; justify-content: center; font-size: 16px;">
          ${emoji}
        </div>
      </div>
    `,
    iconSize: [80, 60],
    iconAnchor: [40, 55],
  });
};

export default function MapPage() {
  const { t, i18n } = useTranslation();
  const location = useGeolocation();
  const { profile } = useUserStore();
  const navigate = useNavigate();
  const { matchHub } = useSignalR();

  // State
  const [restaurants, setRestaurants] = useState<RestaurantDto[]>([]);
  const [activeRestaurant, setActiveRestaurant] = useState<RestaurantDto | null>(null);
  const [nearbyUsers, setNearbyUsers] = useState<TempUserDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterRadius, setFilterRadius] = useState<number>(2000);
  const [activeFilterCategory, setActiveFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [incomingRequest, setIncomingRequest] = useState<any>(null);
  const [isSendingRequest, setIsSendingRequest] = useState(false);

  const changeLanguage = () => {
    const nextLang = i18n.language === 'en' ? 'vi' : 'en';
    i18n.changeLanguage(nextLang);
  };

  const centerLat = location.lat || 10.776889;
  const centerLng = location.lng || 106.700806;

  // Fetch restaurants from API
  const fetchRestaurants = async () => {
    setIsLoading(true);
    try {
      if (location.lat && location.lng) {
        const data = await restaurantApi.getNearby(location.lat, location.lng, filterRadius);
        setRestaurants(data);
      }
    } catch (error) {
      console.error('Failed to fetch restaurants', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Update user location & fetch nearby buddies
  const updateAndFetchUsers = async () => {
    try {
      if (location.lat && location.lng && profile) {
        await tempUserApi.updateLocation(profile.id, location.lat, location.lng);
        const users = await tempUserApi.getNearby(location.lat, location.lng, filterRadius / 1000);
        setNearbyUsers(users.filter(u => u.id !== profile.id));
      }
    } catch (e) {
      console.error('Failed to update/fetch temp users', e);
    }
  };

  useEffect(() => {
    if (!location.isLoading && location.lat && location.lng) {
      fetchRestaurants();
      if (profile) {
        updateAndFetchUsers();
      }
    }
  }, [location.isLoading, location.lat, location.lng, filterRadius, profile]);

  // Periodic user location update every 30s
  useEffect(() => {
    let interval: any;
    if (profile && location.lat && location.lng) {
      interval = setInterval(() => {
        updateAndFetchUsers();
      }, 30000);
    }
    return () => clearInterval(interval);
  }, [profile, location.lat, location.lng]);

  // SignalR Match Notifications
  useEffect(() => {
    if (matchHub) {
      matchHub.on('MatchRequestReceived', (req: any) => {
        setIncomingRequest(req);
      });

      matchHub.on('MatchRequestResponded', (res: any) => {
        if (res.status === 'Accepted') {
          navigate(`/chat/${res.id}`);
        }
      });

      return () => {
        matchHub.off('MatchRequestReceived');
        matchHub.off('MatchRequestResponded');
      };
    }
  }, [matchHub, navigate]);

  const handleSendMatchRequest = async (targetUserId: string) => {
    if (!profile) return;
    setIsSendingRequest(true);
    try {
      await matchApi.sendRequest({
        toTempUserId: targetUserId,
      });
    } catch (error) {
      console.error('Error sending match request', error);
    } finally {
      setIsSendingRequest(false);
    }
  };

  const handleRespondMatch = async (accept: boolean) => {
    if (!incomingRequest) return;
    try {
      const res = await matchApi.respond(incomingRequest.id, accept);
      setIncomingRequest(null);
      if (accept) {
        navigate(`/chat/${res.id}`);
      }
    } catch (error) {
      console.error('Error responding to match', error);
    }
  };

  // Filtered restaurants by search and active category
  const filteredRestaurants = restaurants.filter(r => {
    const matchesSearch = searchQuery === '' || r.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (activeFilterCategory === 'buffet') {
      return matchesSearch && r.isBuffet;
    }
    if (activeFilterCategory === 'radius1km') {
      return matchesSearch && r.distance <= 1000;
    }
    return matchesSearch;
  });

  return (
    <div className="bg-surface font-body-md text-body-md text-on-surface flex flex-col min-h-screen relative overflow-hidden selection:bg-primary-container selection:text-white">
      {/* Background ambient glows */}
      <div className="fixed -top-24 -left-24 w-80 h-80 rounded-full bg-primary-container/10 blur-[100px] pointer-events-none z-0"></div>
      <div className="fixed top-1/3 -right-24 w-72 h-72 rounded-full bg-secondary-container/10 blur-[90px] pointer-events-none z-0"></div>

      {/* Top Header */}
      <header className="fixed top-0 w-full z-50 pt-safe bg-surface/80 backdrop-blur-xl shadow-[0_1px_16px_rgba(0,0,0,0.35)]">
        <div className="h-16 px-margin flex items-center justify-between">
          <div 
            className="flex items-center gap-space-sm cursor-pointer"
            onClick={() => navigate('/')}
          >
            <img 
              alt="Food Match Brand Icon" 
              className="h-8 w-auto object-contain" 
              src={logoImg} 
            />
            <div className="flex flex-col">
              <span className="font-headline-md text-headline-md leading-tight text-on-surface tracking-tight font-extrabold">
                Food<span className="text-primary-container">Match</span>
              </span>
              <span className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-space-xs">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-secondary-container animate-pulse"></span>
                Sài Gòn
              </span>
            </div>
          </div>
          <div className="flex items-center gap-space-xs">
            {/* Language Switcher */}
            <button
              onClick={changeLanguage}
              className="px-2.5 h-8 flex items-center justify-center rounded-full bg-surface-container/60 text-primary-container hover:bg-surface-container transition-colors font-bold text-label-sm uppercase border border-primary-container/20 mr-1 active:scale-95"
              title="Đổi ngôn ngữ (VN / EN)"
            >
              {i18n.language === 'en' ? 'EN' : 'VN'}
            </button>
            <button 
              className="w-11 h-11 flex items-center justify-center rounded-full bg-surface-container/60 text-on-surface-variant hover:text-on-surface transition-colors relative"
              aria-label="Thông báo"
            >
              <span className="material-symbols-outlined text-[22px]">notifications</span>
              <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-primary-container shadow-[0_0_8px_#ff6b35]"></span>
            </button>
            <button 
              onClick={() => navigate('/profile')} 
              className="w-11 h-11 flex items-center justify-center rounded-full"
              aria-label="Cá nhân"
            >
              {profile?.displayName ? (
                <div className="w-8 h-8 rounded-full bg-primary-container/20 text-primary-container ring-2 ring-primary-container/40 flex items-center justify-center font-bold text-sm">
                  {profile.displayName.charAt(0).toUpperCase()}
                </div>
              ) : (
                <img 
                  alt="Profile" 
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-primary-container/40" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuA92w28fcnzXyfesyI7ypUuEyvf1p5UPHUIovJr0yN3HicG5VCbxRdTRqP8aAwKlfnlhMLCncSiYqORv_MxWipkJB1b9n_O8sG9etzaq9kZOts8_xz3QTUL_JfdrZZbp1UV_uTJhwITx1N4bFcWMVrDw_di98xQ1cB-L3b3B0NlJwYBkMHPRk4EaGQn6Q8wDMKrfj0WCGLW-TAedGPY6d01D6SDUbgOf27W9rMwxnDGvs8VhVmGf2c7RA" 
                />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Map Viewport */}
      <main className="flex flex-col relative w-full pt-16 h-[100dvh] bg-surface z-10 overflow-hidden">
        
        {/* Top Floating Controls: Search & Category Pills */}
        <div className="absolute top-16 left-0 right-0 z-[1000] px-margin pt-space-xs pb-space-sm flex flex-col gap-space-xs pointer-events-none">
          {/* Search Bar */}
          <div className="flex items-center gap-space-xs w-full bg-surface-container/90 backdrop-blur-xl px-space-md py-2.5 rounded-full shadow-[0_8px_24px_rgba(0,0,0,0.6)] border border-white/5 pointer-events-auto">
            <span className="material-symbols-outlined text-primary-container text-[20px]">search</span>
            <input 
              className="bg-transparent border-none outline-none font-body-md text-body-md text-on-surface placeholder:text-outline w-full min-w-0" 
              placeholder={t('map.searchPlaceholder', 'Tìm theo tên món, tên quán...')} 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button 
              aria-label="Bộ lọc" 
              onClick={() => navigate('/suggest')}
              className="w-8 h-8 rounded-full bg-surface-container-high/80 text-primary flex items-center justify-center transition-transform active:scale-90"
            >
              <span className="material-symbols-outlined text-[18px]">tune</span>
            </button>
          </div>

          {/* Quick Category Toggle Pills */}
          <div className="flex items-center gap-space-xs overflow-x-auto no-scrollbar py-0.5 -mx-margin px-margin pointer-events-auto">
            <button 
              onClick={() => setActiveFilterCategory('all')}
              className={`flex-shrink-0 px-space-md h-9 rounded-full font-label-md text-label-md flex items-center gap-1.5 transition-all active:scale-95 ${
                activeFilterCategory === 'all'
                  ? 'bg-primary-container text-on-primary shadow-[0_0_16px_rgba(255,107,53,0.35)] font-bold'
                  : 'bg-surface-container/85 backdrop-blur-md text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">restaurant</span>
              <span>{t('map.allRestaurants', 'Tất cả quán')} ({restaurants.length})</span>
            </button>
            <button 
              onClick={() => setActiveFilterCategory('open')}
              className={`flex-shrink-0 px-space-md h-9 rounded-full font-label-md text-label-md flex items-center gap-1.5 transition-all active:scale-95 ${
                activeFilterCategory === 'open'
                  ? 'bg-primary-container text-on-primary shadow-[0_0_16px_rgba(255,107,53,0.35)] font-bold'
                  : 'bg-surface-container/85 backdrop-blur-md text-on-surface'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-secondary-container animate-pulse"></span>
              <span>Đang mở cửa</span>
            </button>
            <button 
              onClick={() => {
                setActiveFilterCategory('radius1km');
                setFilterRadius(1000);
              }}
              className={`flex-shrink-0 px-space-md h-9 rounded-full font-label-md text-label-md flex items-center gap-1.5 transition-all active:scale-95 ${
                activeFilterCategory === 'radius1km'
                  ? 'bg-primary-container text-on-primary shadow-[0_0_16px_rgba(255,107,53,0.35)] font-bold'
                  : 'bg-surface-container/85 backdrop-blur-md text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[16px] text-secondary">near_me</span>
              <span>{t('map.radius1km', 'Bán kính <1km')}</span>
            </button>
            <button 
              onClick={() => setActiveFilterCategory('buffet')}
              className={`flex-shrink-0 px-space-md h-9 rounded-full font-label-md text-label-md flex items-center gap-1.5 transition-all active:scale-95 ${
                activeFilterCategory === 'buffet'
                  ? 'bg-primary-container text-on-primary shadow-[0_0_16px_rgba(255,107,53,0.35)] font-bold'
                  : 'bg-surface-container/85 backdrop-blur-md text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[16px] text-tertiary">star</span>
              <span>{t('map.buffet', 'Buffet')}</span>
            </button>
          </div>
        </div>

        {/* Floating Location Indicator & Compass Action Buttons */}
        <div className="absolute top-36 left-3 z-[1000] pointer-events-auto flex items-center gap-1.5 bg-surface-container-low/90 backdrop-blur-md px-2.5 py-1 rounded-full shadow-md border border-white/5">
          <span className="w-1.5 h-1.5 rounded-full bg-secondary-container"></span>
          <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">Bến Nghé, Quận 1</span>
        </div>

        <div className="absolute top-36 right-3 z-[1000] pointer-events-auto flex flex-col gap-2">
          <button 
            aria-label="Vị trí hiện tại" 
            onClick={() => setFilterRadius(prev => (prev === 2000 ? 1000 : 2000))}
            className="w-9 h-9 rounded-full bg-surface-container/90 backdrop-blur-md text-on-surface flex items-center justify-center shadow-lg active:scale-90 transition-transform border border-white/5"
          >
            <span className="material-symbols-outlined text-[19px] text-secondary">my_location</span>
          </button>
          <button 
            aria-label="La bàn" 
            onClick={() => navigate('/suggest')}
            className="w-9 h-9 rounded-full bg-surface-container/90 backdrop-blur-md text-on-surface flex items-center justify-center shadow-lg active:scale-90 transition-transform border border-white/5"
          >
            <span className="material-symbols-outlined text-[19px] text-tertiary">explore</span>
          </button>
        </div>

        {/* Interactive Leaflet Map Container */}
        <div className="w-full h-full relative z-0">
          <MapContainer 
            center={[centerLat, centerLng]} 
            zoom={15} 
            style={{ height: '100%', width: '100%', backgroundColor: '#111319' }}
            zoomControl={false}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap contributors'
              className="dark-map-tiles"
            />
            <RecenterMap lat={centerLat} lng={centerLng} />

            {/* User Location Marker */}
            {!location.isLoading && location.lat && location.lng && (
              <Marker 
                position={[location.lat, location.lng]} 
                icon={createUserIcon()}
              >
                <Popup>
                  <div className="font-bold text-secondary text-label-sm">{t('map.youAreHere', 'Bạn ở đây')}</div>
                </Popup>
              </Marker>
            )}

            {/* Restaurant Markers */}
            {filteredRestaurants.map((r) => (
              <Marker 
                key={r.id}
                position={[r.latitude, r.longitude]}
                icon={createRestaurantIcon(r, activeRestaurant?.id === r.id)}
                eventHandlers={{
                  click: () => setActiveRestaurant(r),
                }}
              />
            ))}

            {/* Nearby Buddy Markers */}
            {nearbyUsers.map((u) => (
              u.currentLat && u.currentLng ? (
                <Marker
                  key={u.id}
                  position={[u.currentLat, u.currentLng]}
                  icon={createOtherUserIcon(u)}
                >
                  <Popup>
                    <div className="p-2 min-w-[150px] bg-surface-container text-on-surface">
                      <div className="font-bold text-headline-sm mb-1 text-on-surface">{u.displayName}</div>
                      {u.desiredFood && (
                        <div className="text-body-sm text-primary mb-2">Thèm ăn: {u.desiredFood}</div>
                      )}
                      <button 
                        onClick={() => handleSendMatchRequest(u.id)}
                        disabled={isSendingRequest}
                        className="mt-2 w-full py-1.5 px-2 bg-primary-container text-white rounded-full font-bold text-label-sm transition-all active:scale-95"
                      >
                        {isSendingRequest ? 'Đang gửi...' : 'Rủ ăn chung 👥'}
                      </button>
                    </div>
                  </Popup>
                </Marker>
              ) : null
            ))}
          </MapContainer>
        </div>

        {/* Active Restaurant Detail Card (Pinned Floating Overlay) */}
        {activeRestaurant && (
          <div className="bounce-in absolute bottom-24 left-3 right-3 z-[1100] bg-surface-container/95 backdrop-blur-2xl rounded-2xl p-space-md shadow-[0_16px_36px_rgba(0,0,0,0.85)] flex flex-col gap-space-xs border border-white/10 transition-all duration-300">
            <div className="flex items-start justify-between gap-space-xs">
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-primary-container/20 text-primary font-bold tracking-wide uppercase">
                    {activeRestaurant.isBuffet ? 'BUFFET THƯỢNG HẠNG' : 'QUÁN ĂN ĐẶC SẢN'}
                  </span>
                  <span className="font-label-sm text-label-sm text-secondary-container flex items-center gap-0.5 font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary-container animate-pulse"></span> {t('map.openNow', 'Mở đến 23:00')}
                  </span>
                </div>
                <h3 className="font-headline-md text-headline-md text-on-surface font-extrabold truncate mt-0.5">
                  {activeRestaurant.isBuffet ? '🍲' : '🥖'} {activeRestaurant.name}
                </h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant truncate">
                  {activeRestaurant.address || 'Khu vực trung tâm Sài Gòn'}
                </p>
              </div>
              <button 
                onClick={() => setActiveRestaurant(null)}
                aria-label="Đóng thẻ" 
                className="w-7 h-7 rounded-full bg-surface-container-highest/60 flex items-center justify-center text-outline hover:text-on-surface active:scale-90"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>

            {/* Ratings & Meta Specs */}
            <div className="flex items-center gap-3 font-label-md text-label-md text-on-surface-variant">
              <span className="flex items-center gap-1 text-tertiary-fixed font-bold">
                <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                4.9 <span className="font-normal text-outline text-body-sm">(1,240)</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-secondary font-semibold">
                <span className="material-symbols-outlined text-[15px]">near_me</span> {Math.round(activeRestaurant.distance)}m
              </span>
              <span>•</span>
              <span className="font-normal text-on-surface-variant">{Math.round(activeRestaurant.distance / 80)} phút đi bộ</span>
            </div>

            {/* Signature Dish Pill Card */}
            <div className="flex items-center gap-3 bg-surface-container-low p-2 rounded-xl mt-0.5 border border-white/5">
              <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-surface-container-highest flex items-center justify-center text-2xl">
                {activeRestaurant.isBuffet ? '🍲' : '🥖'}
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-label-sm text-primary font-bold">Món bán chạy nhất</span>
                  <span className="font-label-md text-label-md text-primary-container font-extrabold">65.000đ</span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface truncate font-medium">
                  {activeRestaurant.isBuffet ? 'Buffet hải sản nướng lẩu thả ga' : 'Bánh mì thập cẩm pate bơ thơm lừng'}
                </p>
              </div>
            </div>

            {/* Action Buttons Pair */}
            <div className="grid grid-cols-2 gap-2.5 mt-1">
              <button 
                onClick={() => navigate('/route')}
                className="h-10 rounded-full bg-secondary-container text-on-secondary font-label-lg text-label-lg font-bold flex items-center justify-center gap-1.5 shadow-[0_4px_16px_rgba(0,177,163,0.3)] transition-transform active:scale-95 text-center"
              >
                <span className="material-symbols-outlined text-[18px]">turn_sharp_right</span>
                <span>Chỉ đường 🧭</span>
              </button>
              <button 
                onClick={() => {
                  if (nearbyUsers.length > 0) {
                    handleSendMatchRequest(nearbyUsers[0].id);
                  } else {
                    navigate('/profile');
                  }
                }}
                className="h-10 rounded-full bg-primary-container text-on-primary font-label-lg text-label-lg font-bold flex items-center justify-center gap-1.5 shadow-[0_4px_20px_rgba(255,107,53,0.4)] transition-transform active:scale-95"
              >
                <span className="material-symbols-outlined text-[18px]">people</span>
                <span>Rủ bạn ăn 👥</span>
              </button>
            </div>
          </div>
        )}

        {/* Bottom Sheet Drawer: Nearby Culinary Gems (Peek Mode) */}
        {!activeRestaurant && (
          <div className="bounce-in absolute bottom-20 left-0 right-0 z-[1000] bg-surface-container-low/95 backdrop-blur-2xl rounded-t-2xl shadow-[0_-8px_32px_rgba(0,0,0,0.6)] px-margin pt-3 pb-4 flex flex-col gap-space-sm border-t border-white/5">
            {/* Drag Handle */}
            <div className="w-12 h-1 rounded-full bg-surface-container-highest mx-auto"></div>
            
            {/* Drawer Title Header */}
            <div className="flex items-center justify-between mt-1">
              <div className="flex items-center gap-2">
                <h4 className="font-headline-md text-headline-md text-on-surface font-extrabold">
                  {t('map.nearbyGems', 'Gần bạn nhất')} <span className="text-primary-container font-bold text-label-lg">({filteredRestaurants.length} quán)</span>
                </h4>
              </div>
              <span className="font-label-sm text-label-sm text-secondary font-semibold bg-secondary-container/15 px-2.5 py-1 rounded-full">
                Trong bán kính {filterRadius / 1000}km
              </span>
            </div>

            {/* Horizontal Food Card Carousels (Compact Previews) */}
            <div className="flex gap-space-sm overflow-x-auto no-scrollbar -mx-margin px-margin pt-1 pb-2">
              {filteredRestaurants.slice(0, 8).map((r) => (
                <div 
                  key={r.id}
                  onClick={() => setActiveRestaurant(r)}
                  className="flex-shrink-0 w-64 bg-surface-container rounded-2xl p-2.5 flex gap-2.5 items-center shadow-lg transition-transform active:scale-98 cursor-pointer border border-white/5 hover:border-primary-container/30"
                >
                  <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-surface-container-high relative flex items-center justify-center text-3xl">
                    {r.isBuffet ? '🍲' : '🥖'}
                    <span className="absolute bottom-0 right-0 bg-surface-container-lowest/90 text-tertiary-fixed text-[10px] px-1 rounded-tl-sm font-bold">
                      4.8★
                    </span>
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <h5 className="font-title-md text-title-md text-on-surface font-bold truncate">
                      {r.name}
                    </h5>
                    <span className="font-body-sm text-body-sm text-on-surface-variant truncate">
                      {r.address || 'Quận 1, TP.HCM'}
                    </span>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="font-label-sm text-label-sm text-secondary font-semibold">
                        {Math.round(r.distance)}m
                      </span>
                      <span className="font-label-sm text-label-sm text-on-tertiary-fixed-variant bg-tertiary-container/30 px-1.5 py-0.2 rounded-full font-bold">
                        {r.isBuffet ? '#Buffet' : '#CóChỗĐểXe'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {filteredRestaurants.length === 0 && !isLoading && (
                <div className="text-on-surface-variant text-body-sm py-4">
                  {t('map.notFound', 'Không tìm thấy quán phù hợp quanh đây.')}
                </div>
              )}
              {isLoading && (
                <div className="text-on-surface-variant text-body-sm py-4">
                  {t('map.searching', 'Đang quét quán ngon gần bạn...')}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Screen 6: Matching Toast Notification */}
        {incomingRequest && (
          <div className="absolute top-20 inset-x-margin z-[2000] p-space-sm rounded-lg bg-surface-container/95 backdrop-blur-xl shadow-[0_8px_32px_rgba(255,107,53,0.35)] transition-all duration-300 transform translate-y-0 border border-primary-container/30" id="match-toast">
            <div className="flex items-start justify-between gap-space-sm">
              <div className="flex items-center gap-space-sm">
                <div className="relative flex-shrink-0">
                  <img 
                    className="w-11 h-11 rounded-full object-cover shadow-md ring-2 ring-secondary/40" 
                    alt="Minh Trang"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCdODdqLAYyhq7yYoUPb506j4NyWl-EYTqiSog_eksvoYwz4NXshbZogq66nm11dSIhD9Sx2BieHZm6_5KT2Gf6uoHDGTyYXhpaNitl4yob72TdwrFIBw0puAUPyRP-QGyMlFqI5nhzb3pmWfvgQt792jKL5spK1FC_-QM2tQWs6epcogfg02uKtqqQVc04ASLElgbMNBmW2CcHM3nNAPu86f8lZ7_plHZi4JnieIWXOao6k6bqucTdRA"
                  />
                  <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-secondary rounded-full ring-2 ring-surface"></span>
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-primary-container animate-pulse">notifications_active</span>
                    <span className="font-label-md text-label-md text-primary-container uppercase tracking-wide font-bold">Yêu cầu ghép đôi mới!</span>
                  </div>
                  <p className="font-title-md text-body-md text-on-surface line-clamp-1 font-bold">
                    {incomingRequest.senderName || 'Minh Trang (23t)'} • 400m
                  </p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-1 font-medium">
                    Muốn rủ bạn đi ăn "Bún Bò Huế" ngay 🍜
                  </p>
                </div>
              </div>
              <button 
                className="text-on-surface-variant hover:text-on-surface p-1 rounded-full bg-surface-container-high/60 transition-colors"
                onClick={() => setIncomingRequest(null)}
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            
            {/* Quick Action Buttons */}
            <div className="grid grid-cols-2 gap-space-sm mt-3 pt-2 border-t border-white/5">
              <button 
                className="py-2.5 px-3 rounded-full bg-primary-container text-on-primary font-label-lg text-label-lg shadow-[0_4px_16px_rgba(255,107,53,0.45)] hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-1.5 truncate font-bold"
                onClick={() => handleRespondMatch(true)}
              >
                <span>Đồng Ý Ăn Cùng</span>
                <span className="material-symbols-outlined text-[16px]">bolt</span>
              </button>
              <button 
                className="py-2.5 px-3 rounded-full bg-surface-variant text-on-surface-variant font-label-lg text-label-lg hover:text-on-surface active:scale-95 transition-all truncate font-semibold"
                onClick={() => handleRespondMatch(false)}
              >
                Từ Chối
              </button>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
