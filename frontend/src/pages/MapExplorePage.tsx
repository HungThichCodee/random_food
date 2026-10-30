import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useGeolocation } from '../hooks/useGeolocation';
import { useUserStore } from '../stores/useUserStore';
import {
  directionsMapUrl, hasMapsEmbedKey, placeMapUrl, searchMapUrl, streetViewMapUrl,
  viewMapUrl, type MapPoint, type TravelMode,
} from '../utils/mapsEmbed';

type MapMode = 'view' | 'search' | 'directions' | 'place' | 'streetview';
const mapModes: { mode: MapMode; label: string }[] = [
  { mode: 'view', label: 'Bản đồ' },
  { mode: 'search', label: 'Tìm quán' },
  { mode: 'directions', label: 'Đường đi' },
  { mode: 'place', label: 'Địa điểm' },
  { mode: 'streetview', label: 'Phố 360°' },
];
const travelModes: { mode: TravelMode; label: string }[] = [
  { mode: 'walking', label: 'Đi bộ' },
  { mode: 'driving', label: 'Lái xe' },
  { mode: 'bicycling', label: 'Xe đạp' },
  { mode: 'transit', label: 'Công cộng' },
];
const quickSearches = ['Quán ăn', 'Cà phê', 'Món chay'];

export default function MapExplorePage() {
  const navigate = useNavigate();
  const location = useGeolocation();
  const profile = useUserStore(state => state.profile);
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get('search')?.trim() ?? '';
  const [mode, setMode] = useState<MapMode>(searchQuery ? 'search' : 'view');
  const [inputValue, setInputValue] = useState(searchQuery);
  const [placeTerm, setPlaceTerm] = useState('');
  const [originInput, setOriginInput] = useState('');
  const [routeOrigin, setRouteOrigin] = useState('');
  const [destinationInput, setDestinationInput] = useState('');
  const [routeDestination, setRouteDestination] = useState('');
  const [travelMode, setTravelMode] = useState<TravelMode>('walking');

  useEffect(() => {
    if (!searchQuery) return;
    setInputValue(searchQuery);
    setMode('search');
  }, [searchQuery]);

  const livePosition = location.lat != null && location.lng != null &&
    Number.isFinite(location.lat) && Number.isFinite(location.lng);
  const savedPosition = profile?.currentLat != null && profile.currentLng != null &&
    Number.isFinite(profile.currentLat) && Number.isFinite(profile.currentLng);
  const center: MapPoint | null = livePosition
    ? { lat: location.lat!, lng: location.lng! }
    : savedPosition ? { lat: profile.currentLat!, lng: profile.currentLng! } : null;

  const mapSrc = mode === 'view' ? viewMapUrl(center)
    : mode === 'search' ? searchMapUrl(searchQuery, center)
    : mode === 'place' ? placeMapUrl(placeTerm, center)
    : mode === 'streetview' ? streetViewMapUrl(center)
    : directionsMapUrl(routeOrigin || center, routeDestination, travelMode);

  const selectMode = (next: MapMode) => {
    setMode(next);
    if (next === 'place') {
      const term = placeTerm || searchQuery;
      setInputValue(term);
      if (!placeTerm && searchQuery) setPlaceTerm(searchQuery);
    }
    if (next === 'view' || next === 'search') setInputValue(searchQuery);
    if (next === 'directions' && searchQuery && !routeDestination) {
      setDestinationInput(searchQuery);
    }
  };

  const handleTermSubmit = (event: FormEvent) => {
    event.preventDefault();
    const term = inputValue.trim();
    if (mode === 'place') setPlaceTerm(term);
    else setSearchParams(term ? { search: term } : {});
  };

  const handleRouteSubmit = (event: FormEvent) => {
    event.preventDefault();
    setRouteOrigin(originInput.trim());
    setRouteDestination(destinationInput.trim());
  };

  const showDirectionsTo = (term: string) => {
    setDestinationInput(term);
    setRouteDestination(term);
    setMode('directions');
  };

  const needsGps = mode === 'view' || mode === 'streetview' ||
    (mode === 'directions' && !routeOrigin);
  const missingMessage = mode === 'streetview' && !hasMapsEmbedKey
    ? 'Chế độ Phố 360° cần Maps Embed API key.'
    : mode === 'directions' && !routeDestination
      ? 'Nhập điểm đến rồi bấm Xem đường.'
      : needsGps && !center
        ? mode === 'directions'
          ? 'Cho phép truy cập vị trí hoặc nhập điểm xuất phát để xem đường.'
          : 'Cho phép truy cập vị trí để mở bản đồ tại nơi bạn đang đứng.'
        : mode === 'place' ? 'Nhập tên hoặc địa chỉ để ghim địa điểm.'
          : 'Nhập tên món hoặc quán để tìm trên bản đồ.';

  return (
    <main className="h-[100dvh] w-full bg-background relative flex flex-col">
      <header className="z-10 bg-surface-container pt-safe-top pb-3 px-4 shadow-sm shrink-0">
        <div className="flex items-center gap-3 max-w-[390px] mx-auto">
          <button type="button" onClick={() => navigate(-1)} aria-label="Quay lại"
            className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface shadow-sm shrink-0">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="font-title-sm font-bold text-on-surface">Bản đồ & đường đi</h1>
        </div>

        <div className="mx-auto mt-3 flex max-w-[390px] gap-2 overflow-x-auto pb-1" role="group" aria-label="Chế độ bản đồ">
          {mapModes.map(item => (
            <button key={item.mode} type="button" onClick={() => selectMode(item.mode)}
              aria-pressed={mode === item.mode}
              className={`min-h-10 shrink-0 rounded-full px-3 text-sm font-semibold ${mode === item.mode
                ? 'bg-primary-container text-white' : 'bg-surface-container-high text-on-surface-variant'}`}>
              {item.label}
            </button>
          ))}
        </div>

        {(mode === 'view' || mode === 'search' || mode === 'place') && (
          <>
            <form onSubmit={handleTermSubmit} className="mx-auto mt-3 flex max-w-[390px] gap-2">
              <label htmlFor="map-term" className="sr-only">{mode === 'place' ? 'Tên hoặc địa chỉ địa điểm' : 'Tên quán hoặc món ăn'}</label>
              <input id="map-term" type="search" value={inputValue} maxLength={120}
                onChange={event => setInputValue(event.target.value)}
                placeholder={mode === 'place' ? 'Tên hoặc địa chỉ địa điểm...' : 'Tên quán hoặc món ăn...'}
                className="min-w-0 min-h-11 flex-1 rounded-full bg-surface-container-high px-4 text-on-surface outline-none" />
              <button type="submit" className="min-h-11 rounded-full bg-primary-container px-4 font-semibold text-white">
                {mode === 'place' ? 'Ghim' : 'Tìm'}
              </button>
            </form>
            {mode !== 'place' && (
              <div className="mx-auto mt-2 flex max-w-[390px] gap-2 overflow-x-auto pb-1" role="group" aria-label="Tìm nhanh trên bản đồ">
                {quickSearches.map(term => (
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
            )}
            {(mode === 'search' ? searchQuery : placeTerm) && (
              <button type="button" onClick={() => showDirectionsTo(mode === 'search' ? searchQuery : placeTerm)}
                className="mx-auto mt-2 block max-w-[390px] text-sm font-semibold text-primary underline">
                Chỉ đường tới {mode === 'search' ? searchQuery : placeTerm}
              </button>
            )}
          </>
        )}

        {mode === 'directions' && (
          <>
            <form onSubmit={handleRouteSubmit} className="mx-auto mt-3 flex max-w-[390px] flex-col gap-2">
              <label htmlFor="map-origin" className="sr-only">Điểm xuất phát</label>
              <input id="map-origin" type="text" value={originInput} maxLength={120}
                onChange={event => setOriginInput(event.target.value)} placeholder="Vị trí của tôi (GPS) hoặc nhập điểm đi"
                className="min-h-11 rounded-full bg-surface-container-high px-4 text-on-surface outline-none" />
              <div className="flex gap-2">
                <label htmlFor="map-destination" className="sr-only">Điểm đến</label>
                <input id="map-destination" type="text" value={destinationInput} maxLength={120}
                  onChange={event => setDestinationInput(event.target.value)} placeholder="Nhập quán, địa chỉ hoặc điểm đến"
                  className="min-w-0 min-h-11 flex-1 rounded-full bg-surface-container-high px-4 text-on-surface outline-none" />
                <button type="submit" className="min-h-11 rounded-full bg-primary-container px-4 font-semibold text-white">Xem đường</button>
              </div>
            </form>
            <div className="mx-auto mt-2 flex max-w-[390px] gap-2 overflow-x-auto pb-1" role="group" aria-label="Phương tiện di chuyển">
              {travelModes.map(item => (
                <button key={item.mode} type="button" onClick={() => setTravelMode(item.mode)}
                  aria-pressed={travelMode === item.mode}
                  className={`min-h-10 shrink-0 rounded-full px-3 text-sm font-semibold ${travelMode === item.mode
                    ? 'bg-primary-container text-white' : 'bg-surface-container-high text-on-surface-variant'}`}>
                  {item.label}
                </button>
              ))}
            </div>
          </>
        )}

        <p className="mx-auto mt-2 max-w-[390px] text-xs text-on-surface-variant">
          {mode === 'directions'
            ? 'Google Maps nhận điểm đi và điểm đến. Nếu tên quán trùng, hãy kiểm tra đúng địa chỉ trên bản đồ.'
            : mode === 'streetview'
              ? 'Ảnh 360° gần vị trí của bạn có thể không có ở mọi nơi.'
              : 'Google Maps nhận vị trí đang dùng để hiển thị bản đồ.'}
        </p>
      </header>

      <div className="flex-1 min-h-0 w-full relative">
        {mapSrc && location.error && livePosition && (
          <p role="status" className="absolute top-3 inset-x-3 z-20 rounded-xl bg-surface-container-high/95 px-3 py-2 text-body-sm text-on-surface shadow-lg">
            GPS tạm mất tín hiệu. Bản đồ đang dùng tọa độ đo gần nhất.
          </p>
        )}
        {mapSrc && !location.isLoading && !livePosition && savedPosition &&
          (mode !== 'directions' || !routeOrigin) && (
          <p role="status" className="absolute top-3 inset-x-3 z-20 rounded-xl bg-surface-container-high/95 px-3 py-2 text-body-sm text-on-surface shadow-lg">
            GPS chưa khả dụng. Bản đồ đang dùng vị trí đã lưu, có thể không còn là vị trí hiện tại.
          </p>
        )}
        {mapSrc ? (
          <iframe src={mapSrc} title={`${mapModes.find(item => item.mode === mode)?.label} trên Google Maps`}
            width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin" className="absolute inset-0" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-background">
            <p role="status" className="p-6 text-center text-on-surface-variant">
              {location.isLoading && needsGps && !center ? 'Đang lấy vị trí của bạn...' : missingMessage}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
