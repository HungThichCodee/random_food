import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Toast } from '../stores/useToastStore';
import { useUserStore } from '../stores/useUserStore';
import { matchApi } from '../api/matchApi';
import logoImg from '../assert/logo.png';

export default function HomePage() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { profile } = useUserStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterRotated, setIsFilterRotated] = useState(false);

  const changeLanguage = () => {
    const nextLang = i18n.language === 'en' ? 'vi' : 'en';
    i18n.changeLanguage(nextLang);
  };

  const handleFilterClick = () => {
    setIsFilterRotated(true);
    setTimeout(() => {
      setIsFilterRotated(false);
      navigate('/suggest');
    }, 250);
  };

  return (
    <div className="bg-surface font-body-md text-body-md text-on-surface flex flex-col min-h-screen relative overflow-x-hidden selection:bg-primary-container selection:text-white">
      {/* Background Ambient Glow Elements */}
      <div className="fixed -top-24 -left-24 w-80 h-80 rounded-full bg-primary-container/10 blur-[100px] pointer-events-none z-0"></div>
      <div className="fixed top-1/3 -right-24 w-72 h-72 rounded-full bg-secondary-container/10 blur-[90px] pointer-events-none z-0"></div>

      {/* Header */}
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
                {t('home.yourArea')}
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
              onClick={async () => {
                try {
                  const pendingReqs = await matchApi.getPending();
                  if (pendingReqs && pendingReqs.length > 0) {
                    Toast.show({
                      content: `Bạn có ${pendingReqs.length} lời rủ đi ăn đang chờ!`,
                    });
                  } else {
                    Toast.show({ content: 'Không có thông báo mới' });
                  }
                } catch (e) {}
              }}
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

      {/* Main Content */}
      <main className="flex flex-col relative w-full pt-16 pb-28 bg-surface z-10">
        <div className="flex flex-col w-full px-margin pb-10">
          
          {/* Dynamic Atmospheric Glow Background elements */}
          <div className="relative w-full flex flex-col items-center pt-2">
            {/* Subtle Ambient Radial Glow Backdrops */}
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full bg-primary-container/20 blur-[85px] pointer-events-none"></div>
            <div className="absolute top-24 -left-12 w-48 h-48 rounded-full bg-secondary-container/15 blur-[70px] pointer-events-none"></div>
            <div className="absolute top-20 -right-12 w-48 h-48 rounded-full bg-tertiary/15 blur-[70px] pointer-events-none"></div>
            
            {/* Centered Hero Logo Card with Pulse Neon Glow */}
            <div className="relative group cursor-pointer my-2">
              <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-primary-container via-tertiary to-secondary-container opacity-60 blur-md group-hover:opacity-100 transition duration-700 animate-pulse"></div>
              <div className="relative w-28 h-28 rounded-full bg-surface-container-lowest flex items-center justify-center p-1.5 shadow-[0_0_35px_rgba(255,107,53,0.35)] overflow-hidden">
                <img 
                  alt="Food Match Neon Heart Emblem" 
                  className="w-full h-full object-cover rounded-full" 
                  src={logoImg} 
                />
              </div>
              <span className="absolute bottom-0 right-1 w-6 h-6 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary shadow-md">
                <span className="material-symbols-outlined text-[15px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  local_fire_department
                </span>
              </span>
            </div>

            {/* Title & Tagline */}
            <div className="text-center mt-3 mb-5 z-10">
              <h1 className="font-headline-xl text-headline-xl font-extrabold tracking-tight bg-gradient-to-r from-primary-container via-primary-fixed to-tertiary bg-clip-text text-transparent drop-shadow-[0_2px_12px_rgba(255,107,53,0.4)]">
                Food Match
              </h1>
              <p className="font-body-md text-body-md text-on-surface-variant font-medium mt-1">
                {t('app.subtitle', 'Hôm nay ăn gì? Để chúng tôi quyết định.')}
              </p>
            </div>

            {/* Glassmorphism Search / Quick Status Input */}
            <div className="w-full relative z-10 mb-6">
              <div className="w-full h-12 rounded-full bg-surface-container/70 backdrop-blur-xl flex items-center px-4 shadow-[0_4px_20px_rgba(0,0,0,0.4)] transition-all duration-300 focus-within:shadow-[0_0_20px_rgba(255,107,53,0.3)] focus-within:bg-surface-container-high border border-white/5">
                <span className="material-symbols-outlined text-primary-container text-[20px] mr-2.5">search</span>
                <input 
                  className="w-full bg-transparent text-on-surface placeholder:text-outline font-body-md text-body-md focus:outline-none" 
                  placeholder={t('home.searchPlaceholder')}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') navigate(`/map?search=${encodeURIComponent(searchQuery)}`);
                  }}
                />
                <button 
                  aria-label="Bộ lọc" 
                  onClick={handleFilterClick}
                  className={`w-7 h-7 rounded-full bg-primary-container/20 text-primary-container flex items-center justify-center transition-transform duration-300 active:scale-90 ${isFilterRotated ? 'rotate-45' : ''}`}
                >
                  <span className="material-symbols-outlined text-[16px]">tune</span>
                </button>
              </div>
            </div>
          </div>

          {/* 4 Feature Cards in 2x2 Grid */}
          <section className="w-full mb-8 relative z-10">
            <div className="grid grid-cols-2 gap-3.5">
              
              {/* Card 1: Random Món Ăn */}
              <div 
                onClick={() => navigate('/random')} 
                className="group cursor-pointer relative flex flex-col justify-between p-4 rounded-lg bg-surface-container/75 backdrop-blur-xl shadow-[0_8px_24px_rgba(0,0,0,0.35)] transition-all duration-300 active:scale-[0.98] hover:shadow-[0_0_24px_rgba(255,107,53,0.35)] overflow-hidden border border-white/5"
              >
                <div className="absolute -top-10 -right-10 w-24 h-24 bg-primary-container/15 rounded-full blur-xl pointer-events-none group-hover:scale-150 transition-transform"></div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-full bg-primary-container/20 flex items-center justify-center shadow-[0_0_12px_rgba(255,107,53,0.4)]">
                    <span className="text-xl">🎲</span>
                  </div>
                  <span className="material-symbols-outlined text-primary-container text-[18px] opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all">arrow_forward</span>
                </div>
                <div>
                  <h2 className="font-title-md text-title-md text-on-surface font-bold mb-1 group-hover:text-primary transition-colors">
                    {t('home.randomFood')}
                  </h2>
                  <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-2 leading-tight">
                    {t('home.randomFoodDesc')}
                  </p>
                </div>
                <div className="mt-3 pt-2 flex items-center text-primary font-label-sm text-label-sm font-semibold gap-1">
                  <span>{t('home.spinNow')}</span>
                  <span className="material-symbols-outlined text-[14px]">casino</span>
                </div>
              </div>

              {/* Card 2: Tìm Quán */}
              <div 
                onClick={() => navigate('/map')} 
                className="group cursor-pointer relative flex flex-col justify-between p-4 rounded-lg bg-surface-container/75 backdrop-blur-xl shadow-[0_8px_24px_rgba(0,0,0,0.35)] transition-all duration-300 active:scale-[0.98] hover:shadow-[0_0_24px_rgba(79,219,204,0.35)] overflow-hidden border border-white/5"
              >
                <div className="absolute -top-10 -right-10 w-24 h-24 bg-secondary-container/15 rounded-full blur-xl pointer-events-none group-hover:scale-150 transition-transform"></div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-full bg-secondary-container/20 flex items-center justify-center shadow-[0_0_12px_rgba(79,219,204,0.35)]">
                    <span className="text-xl">🗺️</span>
                  </div>
                  <span className="material-symbols-outlined text-secondary text-[18px] opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all">arrow_forward</span>
                </div>
                <div>
                  <h2 className="font-title-md text-title-md text-on-surface font-bold mb-1 group-hover:text-secondary transition-colors">
                    {t('home.findRestaurant')}
                  </h2>
                  <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-2 leading-tight">
                    {t('home.findRestaurantDesc')}
                  </p>
                </div>
                <div className="mt-3 pt-2 flex items-center text-secondary font-label-sm text-label-sm font-semibold gap-1">
                  <span>{t('home.explore')}</span>
                  <span className="material-symbols-outlined text-[14px]">near_me</span>
                </div>
              </div>

              {/* Card 3: Gợi Ý Khẩu Vị */}
              <div 
                onClick={() => navigate('/suggest')} 
                className="group relative flex flex-col justify-between p-4 rounded-lg bg-surface-container/75 backdrop-blur-xl shadow-[0_8px_24px_rgba(0,0,0,0.35)] transition-all duration-300 active:scale-[0.98] hover:shadow-[0_0_24px_rgba(227,198,51,0.35)] overflow-hidden cursor-pointer border border-white/5"
              >
                <div className="absolute -top-10 -right-10 w-24 h-24 bg-tertiary-container/15 rounded-full blur-xl pointer-events-none group-hover:scale-150 transition-transform"></div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-full bg-tertiary-container/20 flex items-center justify-center shadow-[0_0_12px_rgba(227,198,51,0.35)]">
                    <span className="text-xl">🍽️</span>
                  </div>
                  <span className="material-symbols-outlined text-tertiary text-[18px] opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all">tune</span>
                </div>
                <div>
                  <h2 className="font-title-md text-title-md text-on-surface font-bold mb-1 group-hover:text-tertiary transition-colors">
                    {t('home.suggest')}
                  </h2>
                  <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-2 leading-tight">
                    {t('home.suggestDesc')}
                  </p>
                </div>
                <div className="mt-3 pt-2 flex items-center text-tertiary font-label-sm text-label-sm font-semibold gap-1">
                  <span>{t('home.setup')}</span>
                  <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                </div>
              </div>

              {/* Card 4: Tìm Bạn Ăn */}
              <div 
                onClick={() => navigate('/profile')} 
                className="group relative flex flex-col justify-between p-4 rounded-lg bg-surface-container/75 backdrop-blur-xl shadow-[0_8px_24px_rgba(0,0,0,0.35)] transition-all duration-300 active:scale-[0.98] hover:shadow-[0_0_24px_rgba(255,107,53,0.35)] overflow-hidden cursor-pointer border border-white/5"
              >
                <div className="absolute -top-10 -right-10 w-24 h-24 bg-primary/20 rounded-full blur-xl pointer-events-none group-hover:scale-150 transition-transform"></div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shadow-[0_0_12px_rgba(255,107,53,0.4)]">
                    <span className="text-xl">👥</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-primary-container text-on-primary-container font-label-sm text-label-sm font-extrabold uppercase tracking-wider animate-pulse shadow-sm">
                    Hot
                  </span>
                </div>
                <div>
                  <h2 className="font-title-md text-title-md text-on-surface font-bold mb-1 group-hover:text-primary transition-colors">
                    {t('home.findBuddy')}
                  </h2>
                  <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-2 leading-tight">
                    {t('home.findBuddyDesc')}
                  </p>
                </div>
                <div className="mt-3 pt-2 flex items-center text-primary-fixed font-label-sm text-label-sm font-semibold gap-1">
                  <span>{t('home.joinTable')}</span>
                  <span className="material-symbols-outlined text-[14px]">group_add</span>
                </div>
              </div>

            </div>
          </section>

          {/* Quick Match Flash Action Banner */}
          <section className="w-full mb-8 relative z-10">
            <div className="relative rounded-2xl bg-gradient-to-r from-primary-container via-primary-container to-surface-container-high p-5 overflow-hidden shadow-[0_10px_30px_rgba(255,107,53,0.35)] flex items-center justify-between">
              <div className="relative z-10 flex flex-col pr-3">
                <div className="flex items-center gap-1.5 mb-1 text-on-primary">
                  <span className="material-symbols-outlined text-[18px]">bolt</span>
                  <span className="font-label-sm text-label-sm uppercase tracking-wider font-extrabold">{t('home.quickMatch')}</span>
                </div>
                <h3 className="font-headline-md text-headline-md font-extrabold text-on-primary leading-tight">
                  {t('home.dontKnowWhereToGo')}
                </h3>
                <p className="font-body-sm text-body-sm text-on-primary/80 mt-0.5 max-w-[190px]">
                  {t('home.shakeToFind')}
                </p>
              </div>
              <button 
                onClick={() => navigate('/random')}
                className="relative z-10 px-4 py-2.5 rounded-full bg-surface-container-lowest text-primary font-label-md text-label-md font-bold shadow-lg transition-transform active:scale-95 flex items-center gap-1.5 shrink-0 hover:bg-surface-container"
              >
                <span>{t('home.shakeNow')}</span>
                <span className="material-symbols-outlined text-[16px]">vibration</span>
              </button>
              <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-white/10 blur-xl pointer-events-none"></div>
            </div>
          </section>

          {/* Spacer to push content down if needed, but the padding bottom handles it */}

        </div>
      </main>
    </div>
  );
}
