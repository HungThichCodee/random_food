import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useGeolocation } from '../hooks/useGeolocation';
import { useUserStore } from '../stores/useUserStore';
import {
  directionsMapUrl, hasMapsEmbedKey, placeMapUrl, searchMapUrl, streetViewMapUrl,
  viewMapUrl, type MapPoint, type TravelMode,
} from '../utils/mapsEmbed';

type MapTab = 'search' | 'directions' | 'streetview';
type SearchView = 'results' | 'place';
const myLocation = 'Vị trí của tôi';
const mapTabs: { mode: MapTab; label: string }[] = [
  { mode: 'search', label: 'Tìm quán' },
  { mode: 'directions', label: 'Đường đi' },
  { mode: 'streetview', label: 'Phố 360°' },
];
const travelModes: { mode: TravelMode; label: string }[] = [
  { mode: 'walking', label: 'Đi bộ' },
  { mode: 'driving', label: 'Lái xe' },
  { mode: 'bicycling', label: 'Xe đạp' },
  { mode: 'transit', label: 'Công cộng' },
];
const quickSearches = ['Quán ăn', 'Cà phê', 'Món chay'];

function endpoint(value: string, center: MapPoint | null): MapPoint | string | null {
  const term = value.trim();
  return term === myLocation ? center : term || null;
}

function endpointText(value: MapPoint | string): string {
  return typeof value === 'string' ? value : `${value.lat},${value.lng}`;
}

function externalMapUrl(mode: MapTab, center: MapPoint | null, query: string,
  origin: MapPoint | string | null, destination: MapPoint | string | null,
  travelMode: TravelMode): string {
  if (mode === 'directions') {
    if (!origin || !destination) return '';
    const url = new URL('https://www.google.com/maps/dir/');
    url.searchParams.set('api', '1');
    url.searchParams.set('origin', endpointText(origin));
    url.searchParams.set('destination', endpointText(destination));
    url.searchParams.set('travelmode', travelMode);
    return url.toString();
  }
  if (mode === 'search' && query) {
    const url = new URL('https://www.google.com/maps/search/');
    url.searchParams.set('api', '1');
    url.searchParams.set('query', query);
    return url.toString();
  }
  const url = new URL('https://www.google.com/maps/@');
  url.searchParams.set('api', '1');
  url.searchParams.set('map_action', mode === 'streetview' && center ? 'pano' : 'map');
  if (center) {
    url.searchParams.set(mode === 'streetview' ? 'viewpoint' : 'center', endpointText(center));
    if (mode !== 'streetview') url.searchParams.set('zoom', '15');
  }
  return url.toString();
}

export default function MapExplorePage() {
  const navigate = useNavigate();
  const location = useGeolocation();
  const profile = useUserStore(state => state.profile);
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get('search')?.trim() ?? '';
  const [mode, setMode] = useState<MapTab>('search');
  const [searchView, setSearchView] = useState<SearchView>('results');
  const [inputValue, setInputValue] = useState(searchQuery);
  const [placeTerm, setPlaceTerm] = useState('');
  const [originInput, setOriginInput] = useState(myLocation);
  const [routeOrigin, setRouteOrigin] = useState(myLocation);
  const [destinationInput, setDestinationInput] = useState('');
  const [routeDestination, setRouteDestination] = useState('');
  const [travelMode, setTravelMode] = useState<TravelMode>('walking');
  const [gpsBadgeDismissed, setGpsBadgeDismissed] = useState(false);
  const [loadedSrc, setLoadedSrc] = useState('');

  useEffect(() => {
    if (!searchQuery) return;
    setInputValue(searchQuery);
    setSearchView('results');
    setMode('search');
  }, [searchQuery]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setRouteOrigin(originInput.trim());
      setRouteDestination(destinationInput.trim());
    }, 400);
    return () => window.clearTimeout(timer);
  }, [originInput, destinationInput]);

  const livePosition = location.lat != null && location.lng != null &&
    Number.isFinite(location.lat) && Number.isFinite(location.lng);
  const savedPosition = profile?.currentLat != null && profile.currentLng != null &&
    Number.isFinite(profile.currentLat) && Number.isFinite(profile.currentLng);
  const center: MapPoint | null = livePosition
    ? { lat: location.lat!, lng: location.lng! }
    : savedPosition ? { lat: profile.currentLat!, lng: profile.currentLng! } : null;

  const routeStart = endpoint(routeOrigin, center);
  const routeEnd = endpoint(routeDestination, center);
  const mapSrc = mode === 'search'
    ? searchView === 'place' && placeTerm
      ? placeMapUrl(placeTerm, center)
      : searchQuery ? searchMapUrl(searchQuery, center) : viewMapUrl(center)
    : mode === 'streetview' ? streetViewMapUrl(center)
      : directionsMapUrl(routeStart, routeEnd, travelMode);
  const displayedQuery = mode === 'search'
    ? searchView === 'place' ? placeTerm : searchQuery
    : '';
  const externalUrl = externalMapUrl(mode, center, displayedQuery,
    mode === 'directions' ? endpoint(originInput, center) : null,
    mode === 'directions' ? endpoint(destinationInput, center) : null, travelMode);
  const gpsLabel = livePosition
    ? location.error ? 'GPS gần nhất' : 'GPS hiện tại'
    : savedPosition ? 'Vị trí đã lưu'
      : location.isLoading ? 'Đang lấy GPS' : 'Chưa có GPS';
  const isMapLoading = Boolean(mapSrc) && loadedSrc !== mapSrc;

  const handleSearch = (event: FormEvent) => {
    event.preventDefault();
    const term = inputValue.trim();
    setSearchView('results');
    setSearchParams(term ? { search: term } : {});
  };

  const handlePlace = () => {
    const term = inputValue.trim();
    if (!term) return;
    setPlaceTerm(term);
    setSearchView('place');
  };

  const handleRoute = (event: FormEvent) => {
    event.preventDefault();
    setRouteOrigin(originInput.trim());
    setRouteDestination(destinationInput.trim());
  };

  const swapRoute = () => {
    setOriginInput(destinationInput);
    setDestinationInput(originInput);
    setRouteOrigin(destinationInput.trim());
    setRouteDestination(originInput.trim());
  };

  const missingMessage = mode === 'streetview'
    ? !hasMapsEmbedKey ? 'Phố 360° cần Maps Embed API key.'
      : location.isLoading && !center ? 'Đang lấy vị trí của bạn...'
        : 'Cho phép vị trí để xem đường phố quanh bạn.'
    : mode === 'directions'
      ? !routeDestination ? 'Nhập điểm đến để xem tuyến đường.'
        : !routeStart || !routeEnd ? 'Cho phép vị trí hoặc nhập điểm đi.'
          : 'Không thể hiển thị tuyến đường.'
      : location.isLoading && !center ? 'Đang lấy vị trí của bạn...'
        : 'Cho phép vị trí hoặc nhập tên quán để tìm.';

  return (
    <main className="flex h-[100dvh] w-full flex-col overflow-hidden bg-background text-on-surface">
      <h1 className="sr-only">Bản đồ & đường đi</h1>
      <header className="z-10 shrink-0 bg-surface-container px-3 pt-safe pb-2 shadow-sm">
        <div className="mx-auto flex max-w-[430px] items-center gap-1.5">
          <button type="button" onClick={() => navigate(-1)} aria-label="Quay lại"
            className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-full bg-surface-container-high text-on-surface">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div className="flex min-w-0 flex-1 gap-1" role="group" aria-label="Chế độ bản đồ">
            {mapTabs.map(item => (
              <button key={item.mode} type="button" onClick={() => setMode(item.mode)}
                aria-pressed={mode === item.mode}
                className={'min-h-[44px] min-w-0 flex-1 rounded-full px-1 text-xs font-semibold sm:text-sm ' +
                  (mode === item.mode ? 'bg-primary-container text-white' : 'bg-surface-container-high text-on-surface-variant')}>
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {mode === 'search' && (
          <>
            <form onSubmit={handleSearch} className="mx-auto mt-1.5 flex max-w-[430px] gap-1.5">
              <label htmlFor="map-term" className="sr-only">Tên quán hoặc món ăn</label>
              <input id="map-term" type="search" value={inputValue} maxLength={120}
                onChange={event => setInputValue(event.target.value)} placeholder="Tên quán hoặc món..."
                className="h-[44px] min-w-0 flex-1 rounded-full bg-surface-container-high px-3 text-sm text-on-surface outline-none focus-visible:ring-2 focus-visible:ring-primary-container" />
              <button type="submit" className="min-h-[44px] min-w-[44px] shrink-0 rounded-full bg-primary-container px-3 text-sm font-semibold text-white">Tìm</button>
              <button type="button" onClick={handlePlace} disabled={!inputValue.trim()}
                aria-label="Xem địa điểm" className="min-h-[44px] min-w-[44px] shrink-0 rounded-full bg-surface-container-high px-3 text-sm font-semibold text-on-surface disabled:opacity-50">Xem</button>
            </form>
            <div className="mx-auto mt-1.5 flex max-w-[430px] gap-1.5 overflow-x-auto" role="group" aria-label="Tìm nhanh trên bản đồ">
              {quickSearches.map(term => (
                <button key={term} type="button" onClick={() => {
                  setInputValue(term);
                  setSearchView('results');
                  setSearchParams({ search: term });
                }} aria-pressed={searchView === 'results' && searchQuery === term}
                  className={'min-h-[44px] shrink-0 rounded-full px-3 text-sm font-semibold ' +
                    (searchView === 'results' && searchQuery === term ? 'bg-primary-container text-white' : 'bg-surface-container-high text-on-surface-variant')}>
                  {term}
                </button>
              ))}
            </div>
          </>
        )}

        {mode === 'directions' && (
          <>
            <form onSubmit={handleRoute} className="mx-auto mt-1.5 flex max-w-[430px] gap-1.5">
              <label htmlFor="map-origin" className="sr-only">Điểm xuất phát</label>
              <input id="map-origin" type="text" value={originInput} maxLength={120}
                onChange={event => setOriginInput(event.target.value)} placeholder={myLocation}
                className="h-[44px] min-w-0 flex-1 rounded-full bg-surface-container-high px-3 text-sm text-on-surface outline-none focus-visible:ring-2 focus-visible:ring-primary-container" />
              <button type="button" onClick={swapRoute} disabled={!destinationInput.trim()}
                aria-label="Đổi chiều điểm đi và điểm đến" title="Đổi chiều"
                className="h-[44px] w-[44px] shrink-0 rounded-full bg-surface-container-high text-xl text-primary disabled:opacity-50">⇄</button>
              <label htmlFor="map-destination" className="sr-only">Điểm đến</label>
              <input id="map-destination" type="text" value={destinationInput} maxLength={120}
                onChange={event => setDestinationInput(event.target.value)} placeholder="Điểm đến..."
                className="h-[44px] min-w-0 flex-1 rounded-full bg-surface-container-high px-3 text-sm text-on-surface outline-none focus-visible:ring-2 focus-visible:ring-primary-container" />
            </form>
            <div className="mx-auto mt-1.5 flex max-w-[430px] gap-1.5 overflow-x-auto" role="group" aria-label="Phương tiện di chuyển">
              {travelModes.map(item => (
                <button key={item.mode} type="button" onClick={() => setTravelMode(item.mode)}
                  aria-pressed={travelMode === item.mode}
                  className={'min-h-[44px] shrink-0 rounded-full px-4 text-sm font-semibold ' +
                    (travelMode === item.mode ? 'bg-primary-container text-white' : 'bg-surface-container-high text-on-surface-variant')}>
                  {item.label}
                </button>
              ))}
            </div>
          </>
        )}

        {mode === 'streetview' && (
          <p className="mx-auto mt-1.5 flex min-h-[44px] max-w-[430px] items-center text-sm text-on-surface-variant">
            Xem đường phố quanh vị trí của bạn
          </p>
        )}
      </header>

      <div className="relative min-h-0 w-full flex-1">
        {mapSrc ? (
          <>
            <iframe key={mapSrc} src={mapSrc} onLoad={() => setLoadedSrc(mapSrc)}
              title={(mapTabs.find(item => item.mode === mode)?.label || 'Bản đồ') + ' trên Google Maps'}
              width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="eager"
              referrerPolicy="strict-origin-when-cross-origin" className="absolute inset-0" />
            {isMapLoading && (
              <div role="status" className="pointer-events-none absolute inset-0 z-10 flex flex-col gap-4 bg-surface-container-low p-5" aria-label="Đang tải bản đồ">
                <div className="h-[44px] w-2/3 animate-pulse rounded-full bg-surface-container-high" />
                <div className="h-20 w-full animate-pulse rounded-2xl bg-surface-container-high" />
                <div className="flex-1 animate-pulse rounded-2xl bg-surface-container-high/60" />
                <span className="sr-only">Đang tải bản đồ...</span>
              </div>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-background">
            <p role="status" className="p-6 text-center text-sm text-on-surface-variant">{missingMessage}</p>
          </div>
        )}

        {!gpsBadgeDismissed && (
          <div role="status" className="absolute right-2 top-2 z-20 flex min-h-[44px] items-center rounded-full bg-surface-container/95 pl-3 text-xs text-on-surface shadow-lg">
            <span className="material-symbols-outlined mr-1 text-base text-primary-container">my_location</span>
            {gpsLabel}
            <button type="button" onClick={() => setGpsBadgeDismissed(true)} aria-label="Đóng trạng thái GPS"
              className="ml-1 flex h-[44px] w-[44px] items-center justify-center rounded-full text-on-surface-variant">
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
        )}

        <div className="absolute bottom-3 left-3 right-3 z-20 mx-auto max-w-[430px]">
          {externalUrl ? (
            <a href={externalUrl} target="_blank" rel="noopener noreferrer"
              className="flex min-h-[44px] w-full items-center justify-center rounded-full bg-primary-container px-4 text-center text-sm font-semibold text-white shadow-lg">
              {mode === 'directions' ? 'Mở chỉ đường trong Google Maps' : 'Mở trong Google Maps'}
            </a>
          ) : (
            <button type="button" disabled className="min-h-[44px] w-full rounded-full bg-surface-container-high px-4 text-sm font-semibold text-on-surface-variant opacity-70">
              Mở chỉ đường trong Google Maps
            </button>
          )}
        </div>
      </div>

      <div aria-hidden="true" className="shrink-0 bg-background"
        style={{ height: 'calc(64px + env(safe-area-inset-bottom, 0px) + 12px)' }} />
    </main>
  );
}
