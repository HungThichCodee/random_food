import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useUserStore } from '../stores/useUserStore';
import logoImg from '../assert/logo.png';

interface TrendingDish {
  id: string;
  name: string;
  location: string;
  rating: number;
  badge: string;
  badgeColor: 'primary' | 'secondary';
  price: string;
  imageUrl: string;
  isBookmarked: boolean;
}

const INITIAL_TRENDING_DISHES: TrendingDish[] = [
  {
    id: 'pho-bo',
    name: 'Phở Bò Tái Lăn Hà Nội',
    location: '850m • Quận 1, TP.HCM',
    rating: 4.9,
    badge: '24 người đang ăn',
    badgeColor: 'primary',
    price: '55.000đ - 75.000đ',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDsyg_NvlB7FtipKr7EPnizzsKtYVFpBjs5bcH4jKR5_sxStv1Kac_roblp4WjvbxyNh_L9sCDEl3zh6fWnG4lwSZJ4IpFb9rPgMbjJPUHU4hEn6t8PvYCrkKMa185WNC2osu5l26a1czZws1L4YKJvb7c5IRsoTvhlAkfKrn-cE3SSF3rVTiBANDPoxggEkvmXR81hpN3DgCcZPjzut4whC3A4r5jeS8GhhbdPwd6ikfbHGbEHyDVwaw',
    isBookmarked: false,
  },
  {
    id: 'bun-dau',
    name: 'Bún Đậu Mạc Đĩnh Chi',
    location: '1.2km • Đa Kao, Quận 1',
    rating: 4.8,
    badge: '18 bàn kín',
    badgeColor: 'secondary',
    price: '60.000đ - 90.000đ',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDWOFN7wjJ3XvKWNPFYAcxrikRvOiBHU9ymbHOx_Tt3oJEV-c6c8TvGwqSmk6DkK8wbtL0rqgW9Q3A-gA3pMdPJEogc2W9MaXu2u9YYnAzW0BdH6wRrVor8DJwzjiohngCMgfBEn0E4dAkcknBaUYpZxH4IuPV2qNbFgbfiKOfRQFy-IGkJVjBrbiocOVIDD-JpJRpDIB5n9b1-L3kbAX60I6s87oAPNv_--bWsa13qIHNAURxYCGfkPg',
    isBookmarked: false,
  },
  {
    id: 'com-tam',
    name: 'Cơm Tấm Ba Ghiền Khói',
    location: '2.1km • Phú Nhuận',
    rating: 4.9,
    badge: 'Đang nướng khói thơm',
    badgeColor: 'primary',
    price: '65.000đ - 110.000đ',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBlma7ayNO_3K8LoIHn9FqcYNOYObGTyOWfIFrP38FckCZnFeVygVw5GoGoI5Yj91XxEc7uFvMuqFOjKePFxID052I0UK86WZ7KHS6W4GLKngLv22CeQA77VQi5VeEb4chNZEvD67Cve790o-JuAhyCMKZ7NWf3vDH90Xe8kmYZLuiPkjh5A_fZzAmaGmGIHW35DE1Otlc_Dn1FYx4tzhAOU5DUu6GHQPeq1W9MtO4I1-iVjdwXquEQjw',
    isBookmarked: false,
  },
];

export default function HomePage() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { profile } = useUserStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterRotated, setIsFilterRotated] = useState(false);
  const [dishes, setDishes] = useState<TrendingDish[]>(INITIAL_TRENDING_DISHES);

  const changeLanguage = () => {
    const nextLang = i18n.language === 'en' ? 'vi' : 'en';
    i18n.changeLanguage(nextLang);
  };

  const toggleBookmark = (dishId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDishes(prev =>
      prev.map(d => (d.id === dishId ? { ...d, isBookmarked: !d.isBookmarked } : d))
    );
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
                  placeholder="Tìm theo tâm trạng hoặc quận/huyện..." 
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') navigate('/map');
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
                    Random Món
                  </h2>
                  <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-2 leading-tight">
                    Không cần nghĩ, quay là trúng món ngon đậm vị
                  </p>
                </div>
                <div className="mt-3 pt-2 flex items-center text-primary font-label-sm text-label-sm font-semibold gap-1">
                  <span>Quay ngay</span>
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
                    Tìm Quán
                  </h2>
                  <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-2 leading-tight">
                    Quán ngon gần bạn trên bản đồ sống động quanh đây
                  </p>
                </div>
                <div className="mt-3 pt-2 flex items-center text-secondary font-label-sm text-label-sm font-semibold gap-1">
                  <span>Khám phá</span>
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
                    Gợi Ý
                  </h2>
                  <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-2 leading-tight">
                    Tùy chọn theo ngân sách & khẩu vị riêng của bạn
                  </p>
                </div>
                <div className="mt-3 pt-2 flex items-center text-tertiary font-label-sm text-label-sm font-semibold gap-1">
                  <span>Thiết lập</span>
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
                    Tìm Bạn Ăn
                  </h2>
                  <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-2 leading-tight">
                    Ghép đôi ăn uống tức thì & kết nối hội hè vui vẻ
                  </p>
                </div>
                <div className="mt-3 pt-2 flex items-center text-primary-fixed font-label-sm text-label-sm font-semibold gap-1">
                  <span>Ghép bàn</span>
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
                  <span className="font-label-sm text-label-sm uppercase tracking-wider font-extrabold">Ghép Nhanh 30 Giây</span>
                </div>
                <h3 className="font-headline-md text-headline-md font-extrabold text-on-primary leading-tight">
                  Chưa biết đi đâu?
                </h3>
                <p className="font-body-sm text-body-sm text-on-primary/80 mt-0.5 max-w-[190px]">
                  Lắc nhẹ điện thoại để chọn ngay điểm hẹn lý tưởng
                </p>
              </div>
              <button 
                onClick={() => navigate('/random')}
                className="relative z-10 px-4 py-2.5 rounded-full bg-surface-container-lowest text-primary font-label-md text-label-md font-bold shadow-lg transition-transform active:scale-95 flex items-center gap-1.5 shrink-0 hover:bg-surface-container"
              >
                <span>Lắc Ngay</span>
                <span className="material-symbols-outlined text-[16px]">vibration</span>
              </button>
              <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-white/10 blur-xl pointer-events-none"></div>
            </div>
          </section>

          {/* Trending / Community Section */}
          <section className="w-full relative z-10">
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-primary-container animate-ping"></span>
                <h2 className="font-title-md text-title-md font-bold text-on-surface">Đang thịnh hành hôm nay</h2>
              </div>
              <button 
                onClick={() => navigate('/map')} 
                className="font-label-sm text-label-sm font-semibold text-secondary hover:underline flex items-center gap-0.5"
              >
                Xem tất cả
                <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              </button>
            </div>

            {/* Horizontal Scroll Carousel for Street Food */}
            <div className="flex gap-4 overflow-x-auto pb-4 pt-1 -mx-margin px-margin scrollbar-none snap-x snap-mandatory">
              {dishes.map((dish) => (
                <div 
                  key={dish.id} 
                  onClick={() => navigate('/map')}
                  className="snap-start shrink-0 w-64 rounded-2xl bg-surface-container/75 backdrop-blur-xl shadow-[0_8px_24px_rgba(0,0,0,0.4)] overflow-hidden flex flex-col group transition-transform active:scale-[0.98] cursor-pointer border border-white/5"
                >
                  <div className="relative w-full h-36 overflow-hidden">
                    <img 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      alt={dish.name}
                      src={dish.imageUrl} 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-surface-container via-transparent to-black/30"></div>
                    <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-surface-container-lowest/80 backdrop-blur-md flex items-center gap-1 text-tertiary">
                      <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                      <span className="font-label-sm text-label-sm font-bold text-on-surface">{dish.rating}</span>
                    </div>
                    <div className={`absolute bottom-2 left-2.5 flex items-center gap-1.5 px-2 py-0.5 rounded-full font-label-sm text-label-sm font-bold ${
                      dish.badgeColor === 'primary' 
                        ? 'bg-primary-container/90 text-on-primary-container' 
                        : 'bg-secondary-container/90 text-on-secondary-container'
                    }`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                      <span>{dish.badge}</span>
                    </div>
                  </div>
                  <div className="p-3.5 flex flex-col flex-1 justify-between">
                    <div>
                      <h3 className="font-title-md text-title-md font-bold text-on-surface group-hover:text-primary transition-colors">
                        {dish.name}
                      </h3>
                      <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px] text-secondary">location_on</span>
                        <span>{dish.location}</span>
                      </p>
                    </div>
                    <div className="mt-3 pt-2.5 flex items-center justify-between border-t border-surface-variant/30">
                      <span className={`font-label-md text-label-md font-bold ${dish.badgeColor === 'secondary' ? 'text-secondary' : 'text-primary'}`}>
                        {dish.price}
                      </span>
                      <button 
                        aria-label="Lưu quán" 
                        onClick={(e) => toggleBookmark(dish.id, e)}
                        className={`w-8 h-8 rounded-full bg-surface-container-high text-on-surface flex items-center justify-center transition-colors ${
                          dish.isBookmarked 
                            ? 'text-primary-container bg-primary-container/20' 
                            : 'hover:bg-primary-container hover:text-on-primary'
                        }`}
                      >
                        <span 
                          className="material-symbols-outlined text-[16px]"
                          style={{ fontVariationSettings: dish.isBookmarked ? "'FILL' 1" : "'FILL' 0" }}
                        >
                          {dish.isBookmarked ? 'bookmark' : 'bookmark_border'}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Interactive Community Activity Ticker */}
          <section className="w-full mt-4 p-4 rounded-xl bg-surface-container/50 backdrop-blur-md flex items-center justify-between shadow-sm border border-white/5">
            <div className="flex items-center gap-3">
              <div className="relative flex -space-x-2 shrink-0">
                <div className="w-7 h-7 rounded-full bg-secondary-container/40 flex items-center justify-center text-[10px] font-bold text-secondary">H</div>
                <div className="w-7 h-7 rounded-full bg-primary-container/40 flex items-center justify-center text-[10px] font-bold text-primary">T</div>
                <div className="w-7 h-7 rounded-full bg-tertiary/40 flex items-center justify-center text-[10px] font-bold text-tertiary">M</div>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                <span className="font-semibold text-on-surface">Minh & 3 người khác</span> vừa ghép bàn thành công tại Chợ Bến Thành!
              </p>
            </div>
            <span className="material-symbols-outlined text-outline text-[18px] shrink-0">celebration</span>
          </section>

        </div>
      </main>
    </div>
  );
}
