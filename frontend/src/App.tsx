import { Routes, Route } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import AppLayout from './components/Layout/AppLayout';
import HomePage from './pages/HomePage';
import RandomFoodPage from './pages/RandomFoodPage';
import SuggestFoodPage from './pages/SuggestFoodPage';
import MapPage from './pages/MapPage';
import CreateProfilePage from './pages/CreateProfilePage';

function App() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#ff6b35',
          borderRadius: 8,
        },
      }}
    >
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/random" element={<RandomFoodPage />} />
          <Route path="/suggest" element={<SuggestFoodPage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/profile" element={<CreateProfilePage />} />
        </Route>
      </Routes>
    </ConfigProvider>
  );
}

export default App;
