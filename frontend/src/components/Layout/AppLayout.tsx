import { lazy, Suspense } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CustomToast } from '../CustomToast';
import { useUserStore } from '../../stores/useUserStore';

const GlobalMatchListener = lazy(() => import('../GlobalMatchListener'));

export default function AppLayout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const token = useUserStore((state) => state.profile?.token);

  const tabs = [
    {
      key: '/',
      title: t('Home', 'Trang chủ'),
      icon: 'explore',
    },
    {
      key: '/random',
      title: t('Random', 'Quay món'),
      icon: 'casino',
    },
    {
      key: '/buddies',
      title: t('Buddies', 'Bạn ăn'),
      icon: 'group',
    },
    {
      key: '/profile',
      title: t('Profile', 'Cá nhân'),
      icon: 'person',
    },
  ];

  const hideBottomNav = location.pathname.startsWith('/chat') || location.pathname === '/route';

  return (
    <div className="min-h-[100dvh] bg-background text-on-surface font-body-md w-full relative overflow-x-hidden">
      {token && <Suspense fallback={null}><GlobalMatchListener /></Suspense>}
      <CustomToast />
      
      {/* Main Content Area */}
      <div className="w-full h-full">
        <Outlet />
      </div>

      {/* Floating Pill Bottom Navigation (Hidden on Chat & Route) */}
      {!hideBottomNav && (
        <nav className="fixed bottom-0 w-full z-[1000] pb-safe px-margin mb-3 pointer-events-none">
          <div className="pointer-events-auto max-w-[390px] mx-auto h-16 rounded-full bg-surface-container/85 backdrop-blur-2xl shadow-[0_12px_32px_rgba(0,0,0,0.6)] flex items-center justify-around px-space-xs relative border border-white/5">
          {tabs.map(item => {
            const isActive = location.pathname === item.key;
            return (
              <button
                key={item.key}
                onClick={() => navigate(item.key)}
                className={`flex flex-col items-center justify-center w-16 h-12 rounded-full transition-all duration-300 relative group ${
                  isActive 
                  ? 'text-primary-container shadow-[0_4px_24px_rgba(255,107,53,0.3)] font-label-lg' 
                  : 'text-on-surface-variant hover:text-on-surface font-label-sm'
                }`}
              >
                <span className={`material-symbols-outlined text-[22px] transition-transform ${isActive ? 'scale-110 font-bold' : 'group-hover:scale-110'}`} style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}>
                  {item.icon}
                </span>
                <span className={`text-label-sm mt-0.5 ${isActive ? 'font-bold' : ''}`}>
                  {item.title}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
      )}
    </div>
  );
}
