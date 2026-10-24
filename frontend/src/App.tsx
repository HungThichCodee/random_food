import { Routes, Route } from 'react-router-dom';
import { lazy, Suspense, useEffect } from 'react';
import { SignalRProvider } from './hooks/useSignalR';
import { useUserStore } from './stores/useUserStore';

import AppLayout from './components/Layout/AppLayout';
import RequireActiveProfile from './components/RequireActiveProfile';

const HomePage = lazy(() => import('./pages/HomePage'));
const RandomFoodPage = lazy(() => import('./pages/RandomFoodPage'));
const SuggestFoodPage = lazy(() => import('./pages/SuggestFoodPage'));
const MapPage = lazy(() => import('./pages/MapPage'));
const NearbyBuddiesPage = lazy(() => import('./pages/NearbyBuddiesPage'));
const CreateProfilePage = lazy(() => import('./pages/CreateProfilePage'));
const ChatPage = lazy(() => import('./pages/ChatPage'));
const DirectionRoutePage = lazy(() => import('./pages/DirectionRoutePage'));
const FoodImageCreditsPage = lazy(() => import('./pages/FoodImageCreditsPage'));

function App() {
  const expiresAt = useUserStore((state) => state.profile?.expiresAt);
  const clearProfile = useUserStore((state) => state.clearProfile);

  useEffect(() => {
    if (!expiresAt) return;
    const deadline = new Date(expiresAt).getTime();
    const remaining = deadline - Date.now();
    if (!Number.isFinite(remaining) || remaining <= 0) {
      clearProfile();
      return;
    }
    const timeout = setTimeout(clearProfile, remaining);
    const expireOnResume = () => {
      if (Date.now() >= deadline) clearProfile();
    };
    window.addEventListener('focus', expireOnResume);
    document.addEventListener('visibilitychange', expireOnResume);
    return () => {
      clearTimeout(timeout);
      window.removeEventListener('focus', expireOnResume);
      document.removeEventListener('visibilitychange', expireOnResume);
    };
  }, [expiresAt, clearProfile]);

  return (
    <SignalRProvider>
      <Suspense fallback={<div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 text-center text-on-surface" role="status">Đang tải trang...</div>}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/random" element={<RandomFoodPage />} />
            <Route path="/suggest" element={<SuggestFoodPage />} />
            <Route path="/image-credits" element={<FoodImageCreditsPage />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/buddies" element={<NearbyBuddiesPage />} />
            <Route path="/profile" element={<CreateProfilePage />} />
            <Route path="/chat/:matchId" element={<RequireActiveProfile><ChatPage /></RequireActiveProfile>} />
            <Route path="/chat" element={<RequireActiveProfile><ChatPage /></RequireActiveProfile>} />
            <Route path="/route" element={<RequireActiveProfile privateRouteOnly><DirectionRoutePage /></RequireActiveProfile>} />
          </Route>
        </Routes>
      </Suspense>
    </SignalRProvider>
  );
}

export default App;
