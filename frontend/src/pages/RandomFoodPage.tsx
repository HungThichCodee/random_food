import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useFoodStore } from '../stores/useFoodStore';
import { useUserStore } from '../stores/useUserStore';
import logoImg from '../assert/logo.png';
import { v4 as uuidv4 } from 'uuid';

interface WheelItem {
  id: string;
  name: string;
  shortName: string;
  category: string;
  angle: number; // 0, 45, 90, 135, 180, 225, 270, 315
  desc: string;
  price: string;
  mealTime: string;
  rating: number;
  imageUrl: string;
  tags: string[];
  nearbyCount: number;
}

const WHEEL_ITEMS: WheelItem[] = [
  {
    id: 'pho-bo',
    name: '🍜 Phở Bò Tái Lăn',
    shortName: '🍜 Phở Bò',
    category: 'nuoc',
    angle: 0,
    desc: 'Hà Nội Xưa - Thơm mùi tỏi phi & gừng cháy cạnh',
    price: '45.000đ - 65.000đ',
    mealTime: 'Trưa & Tối',
    rating: 4.9,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDozgiPOAkNyDO6x1RBZXTQBQ_ammku9BlABeo5X2RO8ZVriEZpk_XizbZ6Sj0YgE-ofQDeuuMZZ48UIfAvXaliK8PcUN6DdoZ7aVpdnz1URDcDLpj-OlwVQaVHlutbZOy5m9ONL5GhFK7eOk1Qr8IZhahtWU59-fRqughogBEY2BsrlHn0VfyWKK8N7UPO2WTveaNaNHVSZ1rxpOm7aGCnEmsmES5MEiW_4exZaHAZi12ICLKeM-_NTg',
    tags: ['#ĐậmĐà', '#BòMềm', '#QuẩyGiòn'],
    nearbyCount: 14,
  },
  {
    id: 'banh-mi',
    name: '🥖 Bánh Mì Đặc Biệt',
    shortName: '🥖 Bánh Mì',
    category: 'kho',
    angle: 45,
    desc: 'Pate béo ngậy, thịt xá xíu, chả lụa & dưa leo giòn rụm',
    price: '25.000đ - 40.000đ',
    mealTime: 'Sáng & Chiều',
    rating: 4.8,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBlma7ayNO_3K8LoIHn9FqcYNOYObGTyOWfIFrP38FckCZnFeVygVw5GoGoI5Yj91XxEc7uFvMuqFOjKePFxID052I0UK86WZ7KHS6W4GLKngLv22CeQA77VQi5VeEb4chNZEvD67Cve790o-JuAhyCMKZ7NWf3vDH90Xe8kmYZLuiPkjh5A_fZzAmaGmGIHW35DE1Otlc_Dn1FYx4tzhAOU5DUu6GHQPeq1W9MtO4I1-iVjdwXquEQjw',
    tags: ['#NhanhGọn', '#GiònTan', '#PateThơm'],
    nearbyCount: 22,
  },
  {
    id: 'com-tam',
    name: '🍖 Cơm Tấm Sườn Bì',
    shortName: '🍖 Cơm Tấm',
    category: 'kho',
    angle: 90,
    desc: 'Sườn nướng than hoa thơm lừng, mỡ hành óng ánh',
    price: '40.000đ - 65.000đ',
    mealTime: 'Trưa & Tối',
    rating: 4.9,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBlma7ayNO_3K8LoIHn9FqcYNOYObGTyOWfIFrP38FckCZnFeVygVw5GoGoI5Yj91XxEc7uFvMuqFOjKePFxID052I0UK86WZ7KHS6W4GLKngLv22CeQA77VQi5VeEb4chNZEvD67Cve790o-JuAhyCMKZ7NWf3vDH90Xe8kmYZLuiPkjh5A_fZzAmaGmGIHW35DE1Otlc_Dn1FYx4tzhAOU5DUu6GHQPeq1W9MtO4I1-iVjdwXquEQjw',
    tags: ['#SườnMềm', '#MỡHành', '#ĐậmVị'],
    nearbyCount: 18,
  },
  {
    id: 'bun-bo',
    name: '🍲 Bún Bò Huế Cố Đô',
    shortName: '🍲 Bún Bò',
    category: 'nuoc',
    angle: 135,
    desc: 'Nước dùng cay nồng sả ớt, chả cua & bắp bò giòn sần sật',
    price: '50.000đ - 70.000đ',
    mealTime: 'Sáng & Tối',
    rating: 4.9,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDsyg_NvlB7FtipKr7EPnizzsKtYVFpBjs5bcH4jKR5_sxStv1Kac_roblp4WjvbxyNh_L9sCDEl3zh6fWnG4lwSZJ4IpFb9rPgMbjJPUHU4hEn6t8PvYCrkKMa185WNC2osu5l26a1czZws1L4YKJvb7c5IRsoTvhlAkfKrn-cE3SSF3rVTiBANDPoxggEkvmXR81hpN3DgCcZPjzut4whC3A4r5jeS8GhhbdPwd6ikfbHGbEHyDVwaw',
    tags: ['#CayNồng', '#ChảCua', '#NướcDùngĐậm'],
    nearbyCount: 11,
  },
  {
    id: 'lau-thai',
    name: '🥘 Lẩu Thái Chua Cay',
    shortName: '🥘 Lẩu Thái',
    category: 'nuoc',
    angle: 180,
    desc: 'Hải sản tươi rói, lá chanh chúc thơm ngát kích thích vị giác',
    price: '150.000đ - 220.000đ',
    mealTime: 'Tối',
    rating: 4.8,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDWOFN7wjJ3XvKWNPFYAcxrikRvOiBHU9ymbHOx_Tt3oJEV-c6c8TvGwqSmk6DkK8wbtL0rqgW9Q3A-gA3pMdPJEogc2W9MaXu2u9YYnAzW0BdH6wRrVor8DJwzjiohngCMgfBEn0E4dAkcknBaUYpZxH4IuPV2qNbFgbfiKOfRQFy-IGkJVjBrbiocOVIDD-JpJRpDIB5n9b1-L3kbAX60I6s87oAPNv_--bWsa13qIHNAURxYCGfkPg',
    tags: ['#ChuaCay', '#HảiSản', '#ĂnNhóm'],
    nearbyCount: 8,
  },
  {
    id: 'goi-cuon',
    name: '🥗 Gỏi Cuốn Tôm Thịt',
    shortName: '🥗 Gỏi Cuốn',
    category: 'healthy',
    angle: 225,
    desc: 'Tươi mát, chấm tương đậu phộng béo bùi chuẩn bài',
    price: '30.000đ - 50.000đ',
    mealTime: 'Xế chiều',
    rating: 4.7,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDWOFN7wjJ3XvKWNPFYAcxrikRvOiBHU9ymbHOx_Tt3oJEV-c6c8TvGwqSmk6DkK8wbtL0rqgW9Q3A-gA3pMdPJEogc2W9MaXu2u9YYnAzW0BdH6wRrVor8DJwzjiohngCMgfBEn0E4dAkcknBaUYpZxH4IuPV2qNbFgbfiKOfRQFy-IGkJVjBrbiocOVIDD-JpJRpDIB5n9b1-L3kbAX60I6s87oAPNv_--bWsa13qIHNAURxYCGfkPg',
    tags: ['#ThanhMát', '#ÍtCalo', '#TươngBùi'],
    nearbyCount: 15,
  },
  {
    id: 'ga-nuong',
    name: '🍗 Gà Nướng Cơm Lam',
    shortName: '🍗 Gà Nướng',
    category: 'kho',
    angle: 270,
    desc: 'Gà tre nướng da giòn sốt ớt hiểm kèm cơm lam dẻo thơm',
    price: '120.000đ - 180.000đ',
    mealTime: 'Trưa & Tối',
    rating: 4.9,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBlma7ayNO_3K8LoIHn9FqcYNOYObGTyOWfIFrP38FckCZnFeVygVw5GoGoI5Yj91XxEc7uFvMuqFOjKePFxID052I0UK86WZ7KHS6W4GLKngLv22CeQA77VQi5VeEb4chNZEvD67Cve790o-JuAhyCMKZ7NWf3vDH90Xe8kmYZLuiPkjh5A_fZzAmaGmGIHW35DE1Otlc_Dn1FYx4tzhAOU5DUu6GHQPeq1W9MtO4I1-iVjdwXquEQjw',
    tags: ['#DaGiòn', '#ỚtHiểm', '#ĐặcSản'],
    nearbyCount: 7,
  },
  {
    id: 'bun-dau',
    name: '🍱 Bún Đậu Mắm Tôm',
    shortName: '🍱 Bún Đậu',
    category: 'an_vat',
    angle: 315,
    desc: 'Đậu hũ rán vàng phồng, nem chua rán & mắm tôm đánh bọt',
    price: '55.000đ - 85.000đ',
    mealTime: 'Trưa & Tối',
    rating: 4.8,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDWOFN7wjJ3XvKWNPFYAcxrikRvOiBHU9ymbHOx_Tt3oJEV-c6c8TvGwqSmk6DkK8wbtL0rqgW9Q3A-gA3pMdPJEogc2W9MaXu2u9YYnAzW0BdH6wRrVor8DJwzjiohngCMgfBEn0E4dAkcknBaUYpZxH4IuPV2qNbFgbfiKOfRQFy-IGkJVjBrbiocOVIDD-JpJRpDIB5n9b1-L3kbAX60I6s87oAPNv_--bWsa13qIHNAURxYCGfkPg',
    tags: ['#MắmTôm', '#ĐậuGiòn', '#ChảCốm'],
    nearbyCount: 19,
  },
];

const FILTER_CATEGORIES = [
  { key: 'all', label: 'Tất cả', icon: 'stars' },
  { key: 'kho', label: '🥢 Món Khô' },
  { key: 'nuoc', label: '🍲 Món Nước' },
  { key: 'an_vat', label: '🍢 Ăn Vặt' },
  { key: 'healthy', label: '🥑 Healthy/Chay' },
];

export default function RandomFoodPage() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { profile } = useUserStore();
  const { fetchRandomFood } = useFoodStore();

  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedFood, setSelectedFood] = useState<WheelItem>(WHEEL_ITEMS[0]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentRotation, setCurrentRotation] = useState(0);

  const wheelRef = useRef<SVGSVGElement | null>(null);

  const changeLanguage = () => {
    const nextLang = i18n.language === 'en' ? 'vi' : 'en';
    i18n.changeLanguage(nextLang);
  };

  const filteredItems = WHEEL_ITEMS.filter(item => {
    if (activeFilter === 'all') return true;
    return item.category === activeFilter;
  });

  const triggerSpin = () => {
    if (isSpinning) return;
    setIsSpinning(true);

    // Pick random target from current filtered or full pool
    const pool = filteredItems.length > 0 ? filteredItems : WHEEL_ITEMS;
    const targetIdx = Math.floor(Math.random() * pool.length);
    const chosen = pool[targetIdx];

    // Compute extra full spins (5-7 turns) + angle offset to land on top arrow
    // Top arrow is at 0 deg, so we rotate (360 - chosen.angle)
    const extraSpins = 360 * (5 + Math.floor(Math.random() * 3));
    const targetDeg = extraSpins + (360 - chosen.angle);
    const nextRotation = currentRotation + targetDeg;

    setCurrentRotation(nextRotation);

    // Also trigger backend call in background to log and sync
    let sessionId = localStorage.getItem('foodMatch_sessionId');
    if (!sessionId) {
      sessionId = uuidv4();
      localStorage.setItem('foodMatch_sessionId', sessionId);
    }
    const backendCategory = activeFilter === 'all' ? undefined : (activeFilter === 'kho' ? 'Kho' : (activeFilter === 'nuoc' ? 'Nuoc' : undefined));
    fetchRandomFood({ category: backendCategory, sessionId }).catch(() => {});

    setTimeout(() => {
      setSelectedFood(chosen);
      setIsSpinning(false);
    }, 4500);
  };

  return (
    <div className="bg-surface font-body-md text-body-md text-on-surface flex flex-col min-h-screen relative overflow-x-hidden selection:bg-primary-container selection:text-white">
      {/* Dynamic Atmospheric Glow Background elements */}
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

      {/* Main Content Area */}
      <main className="flex flex-col relative w-full pt-16 pb-28 bg-surface z-10">
        <div className="flex flex-col w-full relative px-margin pb-6 select-none overflow-hidden">
          
          {/* Subheader / Filter count */}
          <div className="flex items-center justify-between mt-2 mb-3">
            <div className="flex items-center gap-space-xs">
              <span className="material-symbols-outlined text-primary-container text-[20px]">tune</span>
              <span className="font-label-lg text-label-lg text-on-surface">Bộ lọc thực đơn</span>
            </div>
            <span className="font-label-sm text-label-sm text-secondary px-2.5 py-1 rounded-full bg-secondary-container/15">
              {filteredItems.length} món đang mở
            </span>
          </div>

          {/* Filter Pills Carousel */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar -mx-margin px-margin pb-2 pt-1">
            {FILTER_CATEGORIES.map(cat => {
              const isActive = activeFilter === cat.key;
              return (
                <button
                  key={cat.key}
                  onClick={() => setActiveFilter(cat.key)}
                  className={`shrink-0 px-4 py-2 rounded-full font-label-md text-label-md flex items-center gap-1.5 transition-all duration-200 ${
                    isActive
                      ? 'text-white bg-primary-container shadow-[0_0_18px_rgba(255,107,53,0.45)]'
                      : 'text-on-surface-variant bg-surface-container-high/80 hover:bg-surface-container-highest'
                  }`}
                >
                  {cat.icon && <span className="material-symbols-outlined text-[16px]">{cat.icon}</span>}
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Spin Wheel Visual Section */}
          <div className="relative w-full flex flex-col items-center justify-center my-3 py-2">
            <div className="absolute w-72 h-72 rounded-full bg-primary-container/15 blur-[60px] pointer-events-none"></div>
            <div className="absolute w-64 h-64 rounded-full bg-secondary-container/10 blur-[50px] pointer-events-none"></div>

            {/* Top Bouncing Pointer */}
            <div className="z-30 -mb-3 flex flex-col items-center drop-shadow-[0_4px_12px_rgba(255,107,53,0.7)] animate-bounce">
              <svg fill="none" height="38" viewBox="0 0 34 38" width="34" xmlns="http://www.w3.org/2000/svg">
                <path d="M17 38L3.14359 14L30.8564 14L17 38Z" fill="#FF6B35" />
                <circle cx="17" cy="11" fill="#4FDBCC" r="10" />
                <circle cx="17" cy="11" fill="#0C0E14" r="4" />
              </svg>
            </div>

            {/* Wheel Outer Capsule */}
            <div className="relative w-[300px] h-[300px] flex items-center justify-center">
              <div 
                className="relative w-full h-full rounded-full p-2 bg-surface-container-lowest/80 backdrop-blur-xl shadow-[0_12px_40px_rgba(0,0,0,0.8),inset_0_0_24px_rgba(255,107,53,0.2)]" 
                id="wheelWrapper"
              >
                {/* SVG Wheel with 8 Slices */}
                <svg 
                  ref={wheelRef}
                  className="w-full h-full" 
                  style={{
                    transform: `rotate(${currentRotation}deg)`,
                    transition: isSpinning ? 'transform 4500ms cubic-bezier(0.15, 0.9, 0.2, 1)' : 'none'
                  }}
                  viewBox="0 0 320 320" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <radialGradient cx="50%" cy="50%" id="sliceGlow" r="50%">
                      <stop offset="0%" stopColor="#FF6B35" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#191B22" stopOpacity="0.8" />
                    </radialGradient>
                  </defs>

                  {/* 8 Segments */}
                  {WHEEL_ITEMS.map((item, idx) => {
                    const isEven = idx % 2 === 0;
                    const textFill = idx % 3 === 0 ? '#FFE256' : idx % 3 === 1 ? '#FFB59D' : '#70F8E8';
                    return (
                      <g key={item.id} transform={`rotate(${item.angle} 160 160)`}>
                        <path 
                          d="M160 160 L100 15 A150 150 0 0 1 220 15 Z" 
                          fill={isEven ? '#20232E' : '#181A22'} 
                        />
                        <text 
                          fill={textFill} 
                          fontFamily="'Be Vietnam Pro', sans-serif" 
                          fontSize="12" 
                          fontWeight="700" 
                          textAnchor="middle" 
                          x="160" 
                          y="52"
                        >
                          {item.shortName}
                        </text>
                      </g>
                    );
                  })}

                  <circle cx="160" cy="160" fill="none" r="148" stroke="#FF6B35" strokeOpacity="0.3" strokeWidth="2" />
                  <circle cx="160" cy="160" fill="none" r="154" stroke="#4FDBCC" strokeDasharray="4 6" strokeOpacity="0.25" strokeWidth="1.5" />
                </svg>

                {/* Center Spin Trigger Button with Glowing Ripple */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className={`absolute w-24 h-24 rounded-full bg-primary-container/20 ${isSpinning ? 'animate-ping' : ''}`}></div>
                  <div className="absolute w-20 h-20 rounded-full bg-primary-container/40"></div>
                  <button 
                    disabled={isSpinning}
                    onClick={triggerSpin}
                    className="pointer-events-auto w-20 h-20 rounded-full bg-gradient-to-tr from-primary-container to-surface-tint text-white shadow-[0_6px_28px_rgba(255,107,53,0.65)] active:scale-95 hover:scale-105 transition-all duration-200 flex flex-col items-center justify-center z-40 disabled:opacity-80 disabled:cursor-not-allowed"
                    id="spinBtn"
                  >
                    <span className="material-symbols-outlined text-[24px] text-white">casino</span>
                    <span className="font-label-sm text-label-sm tracking-wider uppercase font-black text-white leading-none mt-0.5">
                      {isSpinning ? '...' : 'QUAY'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Selected Food Result Card (Stitch Specification) */}
          <div 
            className="w-full rounded-2xl bg-surface-container/90 backdrop-blur-2xl shadow-[0_16px_40px_rgba(0,0,0,0.65)] p-4 transition-all duration-300 relative mt-1 border border-white/5" 
            id="resultCard"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-primary-container shadow-[0_0_8px_#ff6b35]"></span>
                <span className="font-label-sm text-label-sm uppercase tracking-widest text-primary font-bold">
                  Món được chọn hôm nay
                </span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-surface-container-highest text-secondary font-label-sm text-label-sm flex items-center gap-1">
                <span className="material-symbols-outlined text-[13px]">near_me</span>
                450m (5p)
              </span>
            </div>

            <div className="flex items-center gap-space-md mb-3">
              <div className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0 shadow-md">
                <img 
                  alt={selectedFood.name} 
                  className="w-full h-full object-cover" 
                  src={selectedFood.imageUrl} 
                />
                <span className="absolute bottom-1 right-1 bg-surface-container-lowest/80 backdrop-blur-md text-primary font-label-sm text-label-sm px-1.5 py-0.5 rounded-full font-bold">
                  ★ {selectedFood.rating}
                </span>
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <h3 className="font-headline-md text-headline-md text-white font-extrabold truncate" id="foodTitle">
                  {selectedFood.name}
                </h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-1 mt-0.5">
                  {selectedFood.desc}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="font-label-md text-label-md text-tertiary-fixed font-bold">
                    {selectedFood.price}
                  </span>
                  <span className="text-outline text-[11px]">•</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">
                    {selectedFood.mealTime}
                  </span>
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {selectedFood.tags.map(tag => (
                <span key={tag} className="px-2.5 py-1 rounded-full bg-surface-container-high text-on-surface text-[11px] font-medium">
                  {tag}
                </span>
              ))}
              <span className="px-2.5 py-1 rounded-full bg-secondary-container/20 text-secondary text-[11px] font-semibold">
                {selectedFood.nearbyCount} quán gần đây
              </span>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-5 gap-2 pt-1">
              <button 
                disabled={isSpinning}
                onClick={triggerSpin}
                className="col-span-2 h-12 rounded-full bg-secondary-container/15 hover:bg-secondary-container/25 active:scale-95 text-secondary flex items-center justify-center gap-1 font-label-md text-label-md transition-all duration-200 disabled:opacity-50" 
                id="reSpinBtn"
              >
                <span className="material-symbols-outlined text-[18px]">replay</span>
                <span>Quay lại</span>
              </button>
              <button 
                onClick={() => navigate(`/map?search=${encodeURIComponent(selectedFood.name)}`)}
                className="col-span-3 h-12 rounded-full bg-gradient-to-r from-primary-container to-surface-tint text-white shadow-[0_4px_22px_rgba(255,107,53,0.45)] hover:shadow-[0_6px_28px_rgba(255,107,53,0.6)] active:scale-95 flex items-center justify-center gap-1.5 font-label-lg text-label-lg transition-all duration-200"
              >
                <span>Chốt & Tìm quán</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
