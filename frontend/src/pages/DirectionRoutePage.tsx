import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logoImg from '../assert/logo.png';

export default function DirectionRoutePage() {
  const navigate = useNavigate();
  const [navigating, setNavigating] = useState(false);
  const [arrived, setArrived] = useState(false);

  const handleStartNav = () => {
    setNavigating(true);
    // Also provide Google Maps fallback
    window.open('https://www.google.com/maps/dir/?api=1&destination=10.7769,106.7009', '_blank');
  };

  const handleArrived = () => {
    setArrived(true);
    setTimeout(() => {
      navigate('/chat/1');
    }, 1200);
  };

  return (
    <div className="bg-surface font-body-md text-body-md text-on-surface flex flex-col min-h-screen relative overflow-x-hidden selection:bg-primary-container selection:text-white">
      {/* Background Glow */}
      <div className="fixed -top-24 -right-24 w-80 h-80 rounded-full bg-primary-container/10 blur-[100px] pointer-events-none z-0"></div>

      {/* Top Header */}
      <header className="fixed top-0 w-full z-50 pt-safe bg-surface/85 backdrop-blur-xl shadow-[0_1px_16px_rgba(0,0,0,0.35)]">
        <div className="h-16 px-margin flex items-center justify-between gap-space-sm">
          <div className="flex items-center gap-space-sm">
            <button
              onClick={() => navigate(-1)}
              className="w-11 h-11 flex items-center justify-center rounded-full bg-surface-container/60 text-on-surface hover:bg-surface-container transition-colors active:scale-95"
              title="Quay lại"
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back_ios_new</span>
            </button>
            <div 
              className="flex items-center gap-space-sm cursor-pointer"
              onClick={() => navigate('/')}
            >
              <img
                alt="Food Match Brand Icon"
                className="h-7 w-auto object-contain"
                src={logoImg}
              />
              <h1 className="font-title-md text-title-md text-on-surface tracking-tight truncate max-w-[170px] font-bold">
                Chỉ Đường Quán
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-space-xs">
            <button 
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: 'Kèo ăn Phở Thìn', url: window.location.href });
                }
              }}
              className="w-11 h-11 flex items-center justify-center rounded-full bg-surface-container/60 text-on-surface-variant hover:text-on-surface transition-colors active:scale-95"
              title="Chia sẻ đường đi"
            >
              <span className="material-symbols-outlined text-[20px]">share</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex flex-col relative w-full pt-16 pb-safe bg-surface z-10 min-h-screen">
        <div className="flex flex-col w-full relative select-none">
          
          {/* Map Simulation Viewport */}
          <div className="relative w-full h-[600px] overflow-hidden bg-surface-container-lowest">
            
            {/* Stylized Dark Vector Map Grids & Street Network */}
            <svg
              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
              fill="none"
              viewBox="0 0 390 620"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <radialGradient cx="50%" cy="50%" id="mapVignette" r="70%">
                  <stop offset="0%" stopColor="#191b22" stopOpacity="0.4"></stop>
                  <stop offset="100%" stopColor="#0c0e14" stopOpacity="0.95"></stop>
                </radialGradient>
                <linearGradient
                  gradientUnits="userSpaceOnUse"
                  id="routeGradient"
                  x1="72"
                  x2="310"
                  y1="510"
                  y2="170"
                >
                  <stop offset="0%" stopColor="#4fdbcc"></stop>
                  <stop offset="60%" stopColor="#70f8e8"></stop>
                  <stop offset="100%" stopColor="#ffb59d"></stop>
                </linearGradient>
                <filter height="140%" id="tealGlow" width="140%" x="-20%" y="-20%">
                  <feGaussianBlur result="blur" stdDeviation="5"></feGaussianBlur>
                  <feComposite in="SourceGraphic" in2="blur" operator="over"></feComposite>
                </filter>
              </defs>

              {/* Water feature / Saigon River simulation */}
              <path
                d="M-40 40 Q 60 120, 140 80 T 360 20 Q 420 5 460 -20 L 460 -80 L -40 -80 Z"
                fill="#003732"
                fillOpacity="0.25"
              ></path>
              <path
                d="M-30 46 Q 65 125, 143 85 T 365 24"
                fill="none"
                stroke="#4fdbcc"
                strokeDasharray="6 4"
                strokeOpacity="0.2"
                strokeWidth="1.5"
              ></path>

              {/* City Urban Grids / Blocks */}
              <g stroke="#33343b" strokeOpacity="0.35" strokeWidth="1">
                <line x1="20" x2="20" y1="0" y2="620"></line>
                <line x1="70" x2="70" y1="0" y2="620"></line>
                <line x1="120" x2="120" y1="0" y2="620"></line>
                <line x1="180" x2="180" y1="0" y2="620"></line>
                <line x1="240" x2="240" y1="0" y2="620"></line>
                <line x1="300" x2="300" y1="0" y2="620"></line>
                <line x1="360" x2="360" y1="0" y2="620"></line>
                <line x1="0" x2="390" y1="90" y2="90"></line>
                <line x1="0" x2="390" y1="160" y2="160"></line>
                <line x1="0" x2="390" y1="240" y2="240"></line>
                <line x1="0" x2="390" y1="320" y2="320"></line>
                <line x1="0" x2="390" y1="410" y2="410"></line>
                <line x1="0" x2="390" y1="490" y2="490"></line>
                <line x1="0" x2="390" y1="570" y2="570"></line>
              </g>

              {/* Primary Arteries & Avenues (Night glow) */}
              <path d="M-20 380 L 410 260" stroke="#282a30" strokeLinecap="round" strokeWidth="14"></path>
              <path d="M-20 380 L 410 260" stroke="#1e1f26" strokeLinecap="round" strokeWidth="10"></path>
              <path
                d="M70 630 L 70 340 L 290 280 L 290 -20"
                stroke="#282a30"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="16"
              ></path>
              <path
                d="M70 630 L 70 340 L 290 280 L 290 -20"
                stroke="#1e1f26"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="12"
              ></path>
              <path d="M180 630 L 180 160 L 410 100" stroke="#282a30" strokeLinecap="round" strokeWidth="10"></path>

              {/* Street Names (Typography on Map) */}
              <text
                fill="#a98a80"
                fillOpacity="0.4"
                fontFamily="'Be Vietnam Pro'"
                fontSize="9"
                fontWeight="600"
                letterSpacing="0.08em"
                x="82"
                y="440"
              >
                ĐƯỜNG PASTEUR
              </text>
              <text
                fill="#a98a80"
                fillOpacity="0.4"
                fontFamily="'Be Vietnam Pro'"
                fontSize="9"
                fontWeight="600"
                letterSpacing="0.08em"
                transform="rotate(-15 135 325)"
                x="135"
                y="325"
              >
                LÊ LỢI BOULEVARD
              </text>
              <text
                fill="#a98a80"
                fillOpacity="0.5"
                fontFamily="'Be Vietnam Pro'"
                fontSize="9"
                fontWeight="600"
                letterSpacing="0.08em"
                x="298"
                y="235"
              >
                NAM KỲ KHỞI NGHĨA
              </text>

              {/* Background Ambient Vignette */}
              <rect fill="url(#mapVignette)" height="620" width="390"></rect>

              {/* Active Navigation Route: Outer Halo Path */}
              <path
                d="M72 505 L 72 342 Q 72 334 78 332 L 284 274 Q 290 272 290 265 L 290 178"
                fill="none"
                filter="url(#tealGlow)"
                id="routeGlowPath"
                opacity="0.35"
                stroke="#00b1a3"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="10"
              ></path>

              {/* Active Navigation Route: Glowing Core Line */}
              <path
                d="M72 505 L 72 342 Q 72 334 78 332 L 284 274 Q 290 272 290 265 L 290 178"
                fill="none"
                stroke="url(#routeGradient)"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="5"
              ></path>

              {/* Active Navigation Route: Animated Dashed Pulse Motion Effect */}
              <path
                d="M72 505 L 72 342 Q 72 334 78 332 L 284 274 Q 290 272 290 265 L 290 178"
                fill="none"
                opacity="0.9"
                stroke="#ffffff"
                strokeDasharray="10 18"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="3"
              >
                <animate
                  attributeName="stroke-dashoffset"
                  dur="1.8s"
                  from="140"
                  repeatCount="indefinite"
                  to="0"
                ></animate>
              </path>

              {/* Turning Arrow Indicator */}
              <g transform="translate(262, 280) rotate(-78)">
                <polygon fill="#70f8e8" points="0,-7 14,0 0,7 3,0"></polygon>
                <circle cx="2" cy="0" fill="#4fdbcc" fillOpacity="0.25" r="10"></circle>
              </g>
            </svg>

            {/* Point A (User Position Marker) */}
            <div className="absolute left-[72px] top-[505px] -translate-x-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center">
              <div className="absolute w-20 h-20 rounded-full bg-secondary/15 animate-ping opacity-75"></div>
              <div className="absolute w-12 h-12 rounded-full bg-secondary-container/30 animate-pulse"></div>
              <div className="relative w-7 h-7 rounded-full bg-surface-container-lowest flex items-center justify-center shadow-lg shadow-secondary/40">
                <div className="w-4 h-4 rounded-full bg-secondary flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-on-secondary"></div>
                </div>
              </div>
              <div className="absolute top-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-surface-container-high/90 backdrop-blur-md px-2.5 py-1 rounded-full shadow-md flex items-center gap-1 border border-white/5">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
                <span className="font-label-sm text-label-sm text-secondary-fixed font-bold">
                  Vị trí của bạn (Bắt đầu)
                </span>
              </div>
            </div>

            {/* Point B (Destination Restaurant: Phở Thìn Lò Đúc) */}
            <div className="absolute left-[290px] top-[170px] -translate-x-1/2 -translate-y-full pointer-events-none flex flex-col items-center">
              <div className="mb-1 flex items-center gap-1.5 bg-surface-container-highest/95 backdrop-blur-md px-3 py-1.5 rounded-full shadow-xl shadow-primary-container/20 border border-primary-container/30">
                <span className="text-sm">🍜</span>
                <div className="flex flex-col">
                  <span className="font-label-md text-label-md text-primary font-bold leading-none">
                    Phở Thìn Lò Đúc
                  </span>
                  <span className="font-label-sm text-label-sm text-tertiary-fixed font-medium">
                    Bàn 04 • Minh Trang
                  </span>
                </div>
              </div>
              <div className="relative flex items-center justify-center">
                <div className="absolute w-10 h-10 rounded-full bg-primary-container/30 blur-sm animate-pulse"></div>
                <div className="w-9 h-9 rounded-full bg-primary-container flex items-center justify-center text-white shadow-lg shadow-primary-container/60">
                  <span
                    className="material-symbols-outlined text-[20px]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    restaurant
                  </span>
                </div>
                <div className="w-2.5 h-2.5 bg-primary-container rotate-45 -mt-1 rounded-[1px]"></div>
              </div>
              <div className="w-3.5 h-1.5 bg-black/50 rounded-full blur-[2px] mt-0.5"></div>
            </div>

            {/* Floating Top Navigation Step Card */}
            <div className="absolute top-3 inset-x-margin z-20">
              <div className="w-full bg-surface-container-high/90 backdrop-blur-xl rounded-DEFAULT p-space-md shadow-xl flex items-center justify-between gap-space-md border border-white/5">
                <div className="flex items-center gap-space-md min-w-0">
                  <div className="w-12 h-12 rounded-full bg-secondary-container/20 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-secondary-fixed text-[26px]">
                      turn_right
                    </span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-label-sm text-label-sm text-secondary uppercase font-bold tracking-wider">
                        Sau 150m nữa
                      </span>
                      <span className="w-1 h-1 rounded-full bg-secondary/60"></span>
                      <span className="font-label-sm text-label-sm text-outline">Làn ô tô / xe máy</span>
                    </div>
                    <p className="font-title-md text-title-md text-on-surface truncate mt-0.5 font-semibold">
                      Rẽ phải vào <span className="text-primary-fixed font-bold">Nam Kỳ Khởi Nghĩa</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 bg-surface-container-lowest/80 px-2.5 py-2 rounded-lg shrink-0 border border-white/5">
                  <div className="flex flex-col items-center">
                    <span className="material-symbols-outlined text-[15px] text-outline-variant">straight</span>
                    <span className="w-2 h-0.5 bg-outline-variant rounded-full mt-0.5"></span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="material-symbols-outlined text-[15px] text-secondary font-bold">turn_right</span>
                    <span className="w-2 h-0.5 bg-secondary rounded-full mt-0.5"></span>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Controls */}
            <div className="absolute right-4 top-28 flex flex-col gap-2.5 z-10">
              <button
                aria-label="Định vị lại"
                onClick={() => setNavigating(true)}
                className="w-11 h-11 rounded-full bg-surface-container-high/90 backdrop-blur-md text-on-surface flex items-center justify-center shadow-lg active:scale-95 transition-transform border border-white/5"
              >
                <span className="material-symbols-outlined text-[20px] text-secondary">my_location</span>
              </button>
              <button
                aria-label="Chế độ 3D"
                className="w-11 h-11 rounded-full bg-surface-container-high/90 backdrop-blur-md text-on-surface-variant flex items-center justify-center shadow-lg active:scale-95 transition-transform hover:text-on-surface border border-white/5"
              >
                <span className="font-label-md text-label-md font-bold">3D</span>
              </button>
              <button
                aria-label="Lớp giao thông"
                className="w-11 h-11 rounded-full bg-surface-container-high/90 backdrop-blur-md text-on-surface-variant flex items-center justify-center shadow-lg active:scale-95 transition-transform hover:text-on-surface border border-white/5"
              >
                <span className="material-symbols-outlined text-[20px]">layers</span>
              </button>
            </div>

          </div>

          {/* Bottom Glassmorphism Info Bar & Action Panel */}
          <div className="relative z-30 -mt-8 px-margin pb-space-lg flex flex-col gap-space-md">
            <div className="w-full bg-surface-container/95 backdrop-blur-2xl rounded-lg p-space-md shadow-[0_12px_40px_rgba(0,0,0,0.6)] flex flex-col gap-space-md border border-white/5">
              
              {/* Metric Status Row */}
              <div className="flex items-center justify-between">
                <div className="flex items-baseline gap-space-sm">
                  <span className="font-headline-xl text-headline-xl text-tertiary-fixed font-black tracking-tight drop-shadow-sm">
                    10
                  </span>
                  <span className="font-headline-md text-headline-md text-tertiary-fixed font-bold">
                    Phút
                  </span>
                  <span className="text-outline font-body-sm text-body-sm ml-1 self-center">
                    • 350 m
                  </span>
                </div>
                <div className="flex items-center gap-1.5 bg-secondary-container/20 px-3 py-1 rounded-full border border-secondary/30">
                  <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
                  <span className="font-label-sm text-label-sm text-secondary-fixed font-bold">
                    Đường thông thoáng
                  </span>
                </div>
              </div>

              <div className="w-full h-px bg-surface-variant/40"></div>

              {/* Destination Summary */}
              <div className="flex items-start justify-between gap-space-sm">
                <div className="flex items-start gap-space-sm min-w-0">
                  <div className="w-9 h-9 rounded-full bg-primary-container/20 flex items-center justify-center shrink-0 mt-0.5">
                    <span
                      className="material-symbols-outlined text-primary text-[20px]"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      storefront
                    </span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <p className="font-title-md text-title-md text-on-surface truncate font-bold">
                      Phở Thìn Lò Đúc
                    </p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant truncate">
                      138 Nam Kỳ Khởi Nghĩa, Bến Nghé, Quận 1
                    </p>
                  </div>
                </div>
                <span className="shrink-0 font-label-sm text-label-sm bg-surface-container-high px-2.5 py-1 rounded-full text-on-surface-variant border border-white/5">
                  Khoảng 3 ph xe máy
                </span>
              </div>

              {/* Match Info Pill */}
              <div className="flex items-center gap-space-sm bg-surface-container-lowest/80 px-space-md py-2.5 rounded-DEFAULT border border-white/5">
                <div className="flex -space-x-2 shrink-0">
                  <img
                    alt="Minh Trang"
                    className="w-6 h-6 rounded-full object-cover shadow-sm"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBR7ZEztYAKc-GGRvCIhI_3MRA0_JUnECLm731lOitL9Vmb-SvhyLKlbeOV_kgrNpkQIiK1LweBc-VN5HnWbBAqMPGAorfJvojw3BweKBC53sr8gcLBjeieeqOuJejxpPq3Cx8hqnnZiEpQQ-8kiMkVpekAXnP2ewPVTgzgm3XC001u2gwDjoMmWSEIvg3OJY01Z_Qhok29aQyJlPPQn8Bk_oNcKs9XzKKNJlJxeAUBUw0gQrTI7cjCnA"
                  />
                  <div className="w-6 h-6 rounded-full bg-primary-container text-white flex items-center justify-center text-[10px] font-bold">
                    04
                  </div>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface truncate">
                  Bàn đã ghép: <strong className="text-primary-fixed">Cùng Minh Trang</strong> • Bàn số 04 (Tầng trệt)
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-space-sm pt-1">
                {/* Primary Navigation CTA */}
                <button
                  onClick={handleStartNav}
                  className="w-full h-13 py-3.5 px-space-lg rounded-full bg-gradient-to-r from-primary-container to-[#ff8c42] text-white font-label-lg text-label-lg font-bold flex items-center justify-center gap-2 shadow-[0_6px_24px_rgba(255,107,53,0.45)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                >
                  <span className="material-symbols-outlined text-[22px]">navigation</span>
                  <span>{navigating ? 'Đang Mở Điều Hướng...' : 'Bắt Đầu Điều Hướng (GPS)'}</span>
                  <span className="text-base">🚀</span>
                </button>

                {/* Secondary Action Row */}
                <div className="grid grid-cols-3 gap-space-xs mt-1">
                  <a
                    href="tel:0901234567"
                    className="h-11 rounded-full bg-surface-container-high/70 hover:bg-surface-container-high text-on-surface font-label-sm text-label-sm flex items-center justify-center gap-1.5 transition-colors active:scale-95 border border-white/5"
                  >
                    <span className="material-symbols-outlined text-[16px] text-secondary">call</span>
                    <span className="truncate">Gọi Quán</span>
                  </a>
                  <button
                    onClick={handleArrived}
                    className="h-11 rounded-full bg-surface-container-high/70 hover:bg-surface-container-high text-on-surface font-label-sm text-label-sm flex items-center justify-center gap-1.5 transition-colors active:scale-95 border border-white/5"
                  >
                    <span className="material-symbols-outlined text-[16px] text-tertiary">sports_score</span>
                    <span className="truncate">{arrived ? 'Đã Đến! 🎉' : 'Đã Đến Nơi'}</span>
                  </button>
                  <button
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({ title: 'Đường đi Phở Thìn', url: window.location.href });
                      }
                    }}
                    className="h-11 rounded-full bg-surface-container-high/70 hover:bg-surface-container-high text-on-surface font-label-sm text-label-sm flex items-center justify-center gap-1.5 transition-colors active:scale-95 border border-white/5"
                  >
                    <span className="material-symbols-outlined text-[16px] text-primary">share</span>
                    <span className="truncate">Chia Sẻ</span>
                  </button>
                </div>
              </div>

            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
