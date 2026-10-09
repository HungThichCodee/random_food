import { Routes, Route } from 'react-router-dom';
import { SignalRProvider } from './hooks/useSignalR';

import AppLayout from './components/Layout/AppLayout';
import HomePage from './pages/HomePage';
import RandomFoodPage from './pages/RandomFoodPage';
import SuggestFoodPage from './pages/SuggestFoodPage';
import MapPage from './pages/MapPage';
import NearbyBuddiesPage from './pages/NearbyBuddiesPage';
import CreateProfilePage from './pages/CreateProfilePage';
import ChatPage from './pages/ChatPage';
import DirectionRoutePage from './pages/DirectionRoutePage';

function App() {
  return (
    <SignalRProvider>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/random" element={<RandomFoodPage />} />
          <Route path="/suggest" element={<SuggestFoodPage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/buddies" element={<NearbyBuddiesPage />} />
          <Route path="/profile" element={<CreateProfilePage />} />
          <Route path="/chat/:matchId" element={<ChatPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/route" element={<DirectionRoutePage />} />
        </Route>
      </Routes>
    </SignalRProvider>
  );
}

export default App;
