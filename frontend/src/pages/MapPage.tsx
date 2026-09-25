import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { MapContainer, TileLayer, Marker, useMap, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useGeolocation } from '../hooks/useGeolocation';
import { restaurantApi } from '../api/restaurantApi';
import type { RestaurantDto } from '../types/restaurant';

// Component to recenter map when location changes
const RecenterMap = ({ lat, lng }: { lat: number; lng: number }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom());
  }, [lat, lng, map]);
  return null;
};

// Custom icons
const createUserIcon = () => {
  return L.divIcon({
    className: 'custom-user-marker',
    html: `
      <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 48px; height: 48px;">
        <div style="absolute; width: 48px; height: 48px; border-radius: 50%; background-color: rgba(79,219,204,0.2); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="position: absolute; width: 16px; height: 16px; border-radius: 50%; background-color: var(--secondary); border: 4px solid var(--surface); box-shadow: 0 0 18px var(--secondary);"></div>
      </div>
      <style>
        @keyframes ping {
          75%, 100% { transform: scale(2); opacity: 0; }
        }
      </style>
    `,
    iconSize: [48, 48],
    iconAnchor: [24, 24],
  });
};

const createRestaurantIcon = (r: RestaurantDto, isActive: boolean) => {
  const emoji = r.isBuffet ? '🍲' : '🥖';
  const color = r.isBuffet ? 'var(--secondary)' : 'var(--tertiary)';
  const shadow = r.isBuffet ? 'rgba(79,219,204,0.5)' : 'rgba(227,198,51,0.5)';
  
  if (isActive) {
    return L.divIcon({
      className: 'custom-restaurant-marker-active',
      html: `
        <div style="display: flex; flex-direction: column; align-items: center; animation: bounce 1s infinite alternate;">
          <div style="width: 44px; height: 44px; border-radius: 50%; background-color: var(--primary-container); box-shadow: 0 0 24px var(--primary-container); display: flex; align-items: center; justify-content: center; font-size: 20px;">
            ${emoji}
          </div>
          <div style="width: 10px; height: 10px; transform: rotate(45deg); background-color: var(--primary-container); margin-top: -6px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);"></div>
        </div>
        <style>
          @keyframes bounce {
            0% { transform: translateY(0); }
            100% { transform: translateY(-10px); }
          }
        </style>
      `,
      iconSize: [44, 54],
      iconAnchor: [22, 54],
    });
  }

  return L.divIcon({
    className: 'custom-restaurant-marker',
    html: `
      <div style="display: flex; flex-direction: column; align-items: center; transition: transform 0.2s;">
        <div style="padding: 2px 8px; border-radius: 9999px; background-color: rgba(40,42,48,0.9); backdrop-filter: blur(8px); margin-bottom: 4px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <span style="font-size: var(--text-label-sm-size); color: ${color}; font-weight: bold;">${emoji} ${r.name.substring(0, 10)}...</span>
        </div>
        <div style="width: 40px; height: 40px; border-radius: 50%; background-color: var(--surface-container-high); box-shadow: 0 0 18px ${shadow}; display: flex; align-items: center; justify-content: center; font-size: 18px;">
          ${emoji}
        </div>
        <div style="width: 8px; height: 8px; transform: rotate(45deg); background-color: var(--surface-container-high); margin-top: -4px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"></div>
      </div>
    `,
    iconSize: [120, 80],
    iconAnchor: [60, 80],
  });
};

export default function MapPage() {
  const { t } = useTranslation();
  const location = useGeolocation();
  const [restaurants, setRestaurants] = useState<RestaurantDto[]>([]);
  const [activeRestaurant, setActiveRestaurant] = useState<RestaurantDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filterRadius, setFilterRadius] = useState(2000);

  useEffect(() => {
    if (!location.isLoading && location.lat && location.lng) {
      fetchRestaurants();
    }
  }, [location.isLoading, location.lat, location.lng, filterRadius]);

  const fetchRestaurants = async () => {
    setIsLoading(true);
    try {
      if (location.lat && location.lng) {
        const data = await restaurantApi.getNearby(location.lat, location.lng, filterRadius);
        setRestaurants(data);
      }
    } catch (error) {
      console.error("Failed to fetch restaurants", error);
    } finally {
      setIsLoading(false);
    }
  };

  const centerLat = location.lat || 10.776889;
  const centerLng = location.lng || 106.700806;

  return (
    <div style={{ height: 'calc(100vh - 64px)', position: 'relative', overflow: 'hidden' }}>
      
      {/* Search & Filters */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1000, padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', pointerEvents: 'none' }}>
        
        {/* Search Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(30,31,38,0.9)', backdropFilter: 'blur(16px)', padding: '10px 16px', borderRadius: '9999px', boxShadow: '0 8px 24px rgba(0,0,0,0.6)', pointerEvents: 'auto' }}>
          <span className="material-symbols-outlined text-primary-container" style={{ fontSize: '20px' }}>search</span>
          <input 
            type="text" 
            placeholder={t('map.searchPlaceholder')} 
            style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--on-surface)', flex: 1, fontSize: 'var(--text-body-md-size)' }}
          />
          <button style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(40,42,48,0.8)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>tune</span>
          </button>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none', pointerEvents: 'auto' }}>
          <button style={{ padding: '0 16px', height: '36px', borderRadius: '9999px', background: 'var(--primary-container)', color: 'var(--on-primary)', border: 'none', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', flexShrink: 0, boxShadow: '0 0 16px rgba(255,107,53,0.35)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>restaurant</span>
            {t('map.allRestaurants')} ({restaurants.length})
          </button>
          <button 
            onClick={() => setFilterRadius(1000)}
            style={{ padding: '0 16px', height: '36px', borderRadius: '9999px', background: 'rgba(30,31,38,0.85)', backdropFilter: 'blur(8px)', color: 'var(--on-surface)', border: 'none', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}
          >
            <span className="material-symbols-outlined text-secondary" style={{ fontSize: '16px' }}>near_me</span>
            {t('map.radius1km')}
          </button>
          <button style={{ padding: '0 16px', height: '36px', borderRadius: '9999px', background: 'rgba(30,31,38,0.85)', backdropFilter: 'blur(8px)', color: 'var(--on-surface)', border: 'none', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
            <span className="material-symbols-outlined text-tertiary" style={{ fontSize: '16px' }}>star</span>
            {t('map.buffet')}
          </button>
        </div>
      </div>

      {/* Map Container */}
      <MapContainer 
        center={[centerLat, centerLng]} 
        zoom={15} 
        style={{ height: '100%', width: '100%', zIndex: 0, backgroundColor: 'var(--surface-container-lowest)' }}
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        <RecenterMap lat={centerLat} lng={centerLng} />

        {/* User Location Marker */}
        {!location.isLoading && location.lat && location.lng && (
          <Marker 
            position={[location.lat, location.lng]} 
            icon={createUserIcon()}
          >
            <Popup>
              <div style={{ fontWeight: 'bold', color: 'var(--secondary)' }}>{t('map.youAreHere')}</div>
            </Popup>
          </Marker>
        )}

        {/* Restaurant Markers */}
        {restaurants.map((r) => (
          <Marker 
            key={r.id}
            position={[r.latitude, r.longitude]}
            icon={createRestaurantIcon(r, activeRestaurant?.id === r.id)}
            eventHandlers={{
              click: () => setActiveRestaurant(r),
            }}
          />
        ))}
      </MapContainer>

      {/* Map Floating Controls (Location & Compass) */}
      <div style={{ position: 'absolute', top: '90px', right: '12px', zIndex: 1000, display: 'flex', flexDirection: 'column', gap: '8px' }}>
         <button onClick={() => { if(location.lat) { setFilterRadius(filterRadius) } }} style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(30,31,38,0.9)', backdropFilter: 'blur(8px)', color: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '19px' }}>my_location</span>
         </button>
      </div>

      {/* Active Restaurant Info Card */}
      {activeRestaurant && (
        <div className="bounce-in" style={{ position: 'absolute', bottom: '110px', left: '12px', right: '12px', zIndex: 1000, background: 'rgba(30,31,38,0.95)', backdropFilter: 'blur(24px)', borderRadius: '16px', padding: '16px', boxShadow: '0 16px 36px rgba(0,0,0,0.85)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '9999px', background: 'rgba(255,107,53,0.2)', color: 'var(--primary)', fontWeight: 'bold' }}>{activeRestaurant.isBuffet ? 'BUFFET' : 'QUÁN ĂN'}</span>
                <span style={{ fontSize: '10px', color: 'var(--secondary-container)', fontWeight: 'bold' }}>● {t('map.openNow')}</span>
              </div>
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: 'var(--on-surface)' }}>{activeRestaurant.name}</h3>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--on-surface-variant)' }}>{activeRestaurant.address || 'Không rõ địa chỉ'}</p>
            </div>
            <button onClick={() => setActiveRestaurant(null)} style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(51,52,59,0.6)', border: 'none', color: 'var(--outline)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: 'var(--on-surface-variant)', fontWeight: '600' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--tertiary-fixed)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px', fontVariationSettings: "'FILL' 1" }}>star</span> 4.5
            </span>
            <span>•</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--secondary)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>near_me</span> {Math.round(activeRestaurant.distance)}m
            </span>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
            <a href={activeRestaurant.googleMapUrl} target="_blank" rel="noreferrer" style={{ flex: 1, textDecoration: 'none' }}>
              <button style={{ width: '100%', height: '40px', borderRadius: '9999px', background: 'var(--secondary-container)', color: 'var(--on-secondary)', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', border: 'none', boxShadow: '0 4px 16px rgba(0,177,163,0.3)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>turn_sharp_right</span>
                {t('map.getDirections')}
              </button>
            </a>
            <button style={{ flex: 1, height: '40px', borderRadius: '9999px', background: 'var(--primary-container)', color: 'var(--on-primary)', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', border: 'none', boxShadow: '0 4px 20px rgba(255,107,53,0.4)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>moped</span>
              {t('map.inviteBuddy')}
            </button>
          </div>
        </div>
      )}

      {/* Bottom Drawer Preview (Nearby Gems) */}
      {!activeRestaurant && (
        <div className="bounce-in" style={{ position: 'absolute', bottom: '0', left: '0', right: '0', zIndex: 1000, background: 'rgba(25,27,34,0.95)', backdropFilter: 'blur(24px)', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', padding: '12px 16px 24px', boxShadow: '0 -8px 32px rgba(0,0,0,0.6)' }}>
          <div style={{ width: '48px', height: '4px', borderRadius: '9999px', background: 'var(--surface-container-highest)', margin: '0 auto 12px' }}></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h4 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: 'var(--on-surface)' }}>
              {t('map.nearbyGems')} <span style={{ color: 'var(--primary-container)', fontSize: '14px' }}>{t('map.restaurantsCount', { count: restaurants.length })}</span>
            </h4>
            <span style={{ fontSize: '10px', background: 'rgba(0,177,163,0.15)', color: 'var(--secondary)', padding: '4px 10px', borderRadius: '9999px', fontWeight: 'bold' }}>
              {t('map.radius', { km: filterRadius/1000 })}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px', scrollbarWidth: 'none', margin: '0 -16px', paddingLeft: '16px', paddingRight: '16px' }}>
            {restaurants.slice(0, 5).map(r => (
              <div key={r.id} onClick={() => setActiveRestaurant(r)} style={{ flexShrink: 0, width: '240px', background: 'var(--surface-container)', borderRadius: '16px', padding: '10px', display: 'flex', gap: '10px', alignItems: 'center', boxShadow: '0 8px 16px rgba(0,0,0,0.2)', cursor: 'pointer' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '12px', background: 'var(--surface-container-high)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px' }}>
                  {r.isBuffet ? '🍲' : '🥖'}
                </div>
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                  <h5 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: 'var(--on-surface)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.name}</h5>
                  <span style={{ fontSize: '12px', color: 'var(--on-surface-variant)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.address || 'Không rõ'}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                    <span style={{ fontSize: '10px', color: 'var(--secondary)', fontWeight: 'bold' }}>{Math.round(r.distance)}m</span>
                    <span style={{ fontSize: '9px', color: 'var(--on-tertiary-fixed-variant)', background: 'rgba(197,171,16,0.3)', padding: '2px 6px', borderRadius: '9999px', fontWeight: 'bold' }}>{r.isBuffet ? '#Buffet' : '#GầnNhất'}</span>
                  </div>
                </div>
              </div>
            ))}
            {restaurants.length === 0 && !isLoading && (
               <div style={{ fontSize: '14px', color: 'var(--on-surface-variant)', padding: '16px 0' }}>{t('map.notFound')}</div>
            )}
            {isLoading && (
               <div style={{ fontSize: '14px', color: 'var(--on-surface-variant)', padding: '16px 0' }}>{t('map.searching')}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
