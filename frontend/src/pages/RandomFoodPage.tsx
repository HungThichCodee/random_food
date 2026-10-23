import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { foodApi } from '../api/foodApi';
import { useFoodStore } from '../stores/useFoodStore';
import { useUserStore } from '../stores/useUserStore';
import type { FoodResponseDto } from '../types/food';
import { safeFoodImageUrl, suggestedFoodImage } from '../utils/foodImages';
import './RandomFoodPage.css';

const filters = [
  { key: 'all', label: 'Tất cả', icon: 'apps' },
  { key: 'man', label: 'Món mặn', icon: 'restaurant' },
  { key: 'chay', label: 'Chay', icon: 'eco' },
  { key: 'ngot', label: 'Ngọt', icon: 'icecream' },
] as const;

const priceLabel: Record<string, string> = { Re: 'Rẻ', Vua: 'Vừa', Cao: 'Cao' };
const mealLabel: Record<string, string> = { Sang: 'Sáng', Trua: 'Trưa', Toi: 'Tối', Khuya: 'Khuya' };
const cardGap = 12;
const spinDuration = 4100;

function wrap(index: number, count: number) {
  return ((index % count) + count) % count;
}

function appearance(food: FoodResponseDto) {
  const tags = food.tags.map((tag) => tag.toLocaleLowerCase('vi'));
  if (tags.includes('ngọt')) return { icon: '🍮', label: 'Món ngọt', tone: 'text-tertiary' };
  if (tags.includes('chay')) return { icon: '🥬', label: 'Món chay', tone: 'text-secondary' };
  return { icon: food.category === 'Nuoc' ? '🍜' : '🍽️', label: 'Món mặn', tone: 'text-primary' };
}

function FoodPhoto({ food, className }: { food: FoodResponseDto; className: string }) {
  const [sourceIndex, setSourceIndex] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const suggested = suggestedFoodImage(food);
  const imageUrl = safeFoodImageUrl(food.imageUrl);
  const sources = imageUrl ? [imageUrl, suggested] : [suggested];

  useEffect(() => {
    setSourceIndex(0);
    setImageLoaded(false);
  }, [food.id, food.imageUrl]);
  useEffect(() => setImageLoaded(false), [sourceIndex]);

  return (
    <div className={`${className} relative`}>
      <span className="absolute inset-0 flex items-center justify-center text-5xl" aria-hidden="true">
        {appearance(food).icon}
      </span>
      {sourceIndex < sources.length && (
        <img src={sources[sourceIndex]} alt={food.name} loading="lazy" decoding="async"
          className={`absolute inset-0 h-full w-full object-cover transition-opacity ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setImageLoaded(true)}
          onError={() => setSourceIndex((index) => index + 1)} />
      )}
    </div>
  );
}

export default function RandomFoodPage() {
  const navigate = useNavigate();
  const { wheelFoods, fetchWheelFoods, isLoading, error } = useFoodStore();
  const profileId = useUserStore((state) => state.profile?.id);
  const [filter, setFilter] = useState<(typeof filters)[number]['key']>('all');
  const [selected, setSelected] = useState<FoodResponseDto | null>(null);
  const [replacement, setReplacement] = useState<{ index: number; food: FoodResponseDto } | null>(null);
  const [spinError, setSpinError] = useState('');
  const [spinning, setSpinning] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(0);
  const [slideIndex, setSlideIndex] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [animate, setAnimate] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ pointerId: number; startX: number } | null>(null);
  const spinTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(false);
  const count = wheelFoods.length;
  const shownFoods = wheelFoods.map((food, index) => replacement?.index === index ? replacement.food : food);
  const cardWidth = Math.min(282, Math.max(200, viewportWidth * 0.72));
  const offset = viewportWidth / 2 - cardWidth / 2 - slideIndex * (cardWidth + cardGap) + dragOffset;

  useEffect(() => {
    setSelected(null);
    setReplacement(null);
    setSpinError('');
    setModalOpen(false);
    fetchWheelFoods(filter === 'all' ? undefined : filter);
  }, [filter, fetchWheelFoods]);

  useEffect(() => {
    setAnimate(false);
    setSlideIndex(count);
    setActiveIndex(0);
  }, [count, filter]);

  useEffect(() => {
    const element = viewportRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setViewportWidth(entry.contentRect.width));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (spinTimer.current) clearTimeout(spinTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!modalOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setModalOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [modalOpen]);

  const move = (direction: number) => {
    if (!count || spinning) return;
    setAnimate(true);
    setSlideIndex((current) => current + direction);
    setActiveIndex((current) => wrap(current + direction, count));
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!count || spinning) return;
    dragRef.current = { pointerId: event.pointerId, startX: event.clientX };
    event.currentTarget.setPointerCapture(event.pointerId);
    setAnimate(false);
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    setDragOffset(event.clientX - dragRef.current.startX);
  };

  const onPointerEnd = (event: PointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    const distance = event.clientX - dragRef.current.startX;
    dragRef.current = null;
    setDragOffset(0);
    if (Math.abs(distance) > 35) move(distance < 0 ? 1 : -1);
    else setAnimate(true);
  };

  const spin = async () => {
    if (spinning || !count) return;
    setSpinning(true);
    setSelected(null);
    setReplacement(null);
    setModalOpen(false);
    setSpinError('');

    let guestSession = localStorage.getItem('foodMatch_sessionId');
    if (!guestSession) {
      guestSession = uuidv4();
      localStorage.setItem('foodMatch_sessionId', guestSession);
    }

    let picked: FoodResponseDto;
    try {
      picked = await foodApi.getRandomFood({
        category: filter === 'all' ? undefined : filter,
        sessionId: profileId || guestSession,
      });
    } catch {
      if (mountedRef.current) {
        setSpinError('Không chọn được món. Hãy kiểm tra kết nối và thử lại.');
        setSpinning(false);
      }
      return;
    }
    if (!mountedRef.current) return;

    let target = wheelFoods.findIndex((food) => food.id === picked.id);
    if (target < 0) {
      target = Math.floor(Math.random() * count);
      setReplacement({ index: target, food: picked });
    }

    const finish = () => {
      setAnimate(false);
      setSlideIndex(count + target);
      setActiveIndex(target);
      setSelected(picked);
      setSpinning(false);
      setModalOpen(true);
      spinTimer.current = null;
    };

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      finish();
      return;
    }

    setAnimate(false);
    setSlideIndex(count + wrap(slideIndex, count));
    requestAnimationFrame(() => {
      if (!mountedRef.current) return;
      requestAnimationFrame(() => {
        if (!mountedRef.current) return;
        setAnimate(true);
        setSlideIndex(3 * count + target);
      });
    });
    spinTimer.current = setTimeout(finish, spinDuration);
  };

  return (
    <main className="min-h-[100dvh] overflow-hidden bg-background px-4 pb-32 text-on-surface">
      <div className="mx-auto w-full max-w-xl pt-safe-top">
        <header className="random-page-header flex items-center gap-3 py-5">
          <button type="button" onClick={() => navigate(-1)} aria-label="Quay lại"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-surface-container-high text-on-surface">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Food Match</p>
            <h1 className="text-[22px] font-extrabold leading-tight">Hôm nay ăn gì?</h1>
          </div>
        </header>

        <section className="random-page-panel relative overflow-hidden rounded-[28px] border border-primary-container/20 bg-surface-container-low p-4 shadow-[0_18px_45px_rgba(0,0,0,0.22)] sm:p-6">
          <div className="pointer-events-none absolute -right-12 -top-14 h-40 w-40 rounded-full bg-primary-container/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-14 -left-12 h-40 w-40 rounded-full bg-secondary/10 blur-3xl" />
          <div className="relative">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-secondary">Vòng quay món ăn</p>
                <h2 className="mt-1 text-lg font-bold">Để vận may chọn món</h2>
              </div>
              <span className="material-symbols-outlined rounded-full bg-primary-container/15 p-2 text-primary">casino</span>
            </div>

            <div className="random-page-filters mt-5 grid grid-cols-4 gap-1.5 rounded-full bg-surface-container-high p-1.5" role="group" aria-label="Lọc món ăn">
              {filters.map((item) => (
                <button key={item.key} type="button" disabled={spinning} onClick={() => setFilter(item.key)}
                  aria-pressed={filter === item.key}
                  className={`flex min-h-11 flex-col items-center justify-center rounded-full px-1 py-1 text-[11px] font-bold leading-tight transition-colors disabled:opacity-60 sm:flex-row sm:gap-1.5 sm:text-sm ${filter === item.key ? 'bg-primary-container text-white shadow-[0_5px_16px_rgba(255,107,53,0.3)]' : 'text-on-surface-variant hover:bg-white/5'}`}>
                  <span className="material-symbols-outlined text-[17px]" aria-hidden="true">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>

            <div className="random-page-intro mt-6 flex items-center justify-between gap-2 text-xs text-on-surface-variant">
              <span>Vuốt để xem món</span>
              <span>{count > 0 ? `${count} món trên vòng quay` : 'Đang tải món'}</span>
            </div>

            <div className="random-page-carousel relative mt-3">
              <div className="pointer-events-none absolute left-1/2 top-0 z-20 -translate-x-1/2">
                <div className="h-0 w-0 border-l-[10px] border-r-[10px] border-t-[15px] border-l-transparent border-r-transparent border-t-primary-container drop-shadow-[0_3px_8px_rgba(255,107,53,0.8)]" />
              </div>
              <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-9 bg-gradient-to-r from-surface-container-low to-transparent" />
              <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-9 bg-gradient-to-l from-surface-container-low to-transparent" />
              <div ref={viewportRef} role="region" aria-roledescription="carousel" aria-label="Các món trên vòng quay"
                onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerEnd}
                onPointerCancel={() => { dragRef.current = null; setDragOffset(0); setAnimate(true); }}
                className="random-page-carousel-viewport overflow-hidden py-5 select-none" style={{ touchAction: 'pan-y' }}>
                {count > 0 && viewportWidth > 0 ? (
                  <div className="flex w-max items-stretch" style={{ gap: cardGap, transform: `translate3d(${offset}px, 0, 0)`, transition: animate ? `transform ${spinning ? spinDuration : 420}ms ${spinning ? 'cubic-bezier(0.12, 0.68, 0.13, 1)' : 'cubic-bezier(0.2, 0.8, 0.2, 1)'}` : 'none' }}
                    onTransitionEnd={(event) => {
                      if (event.target !== event.currentTarget || spinning) return;
                      if (slideIndex < count || slideIndex >= 2 * count) {
                        setAnimate(false);
                        setSlideIndex(count + wrap(slideIndex, count));
                      }
                    }}>
                    {Array.from({ length: 4 }, (_, loop) => shownFoods.map((food, index) => {
                      const presentation = appearance(food);
                      const isCentered = !spinning && loop * count + index === slideIndex;
                      return (
                        <article key={`${loop}-${index}-${food.id}`} aria-hidden={loop !== 1} style={{ width: cardWidth }}
                          className={`random-page-card flex min-h-[265px] shrink-0 flex-col rounded-[26px] border p-4 shadow-[0_14px_26px_rgba(0,0,0,0.25)] transition-colors ${isCentered ? 'border-primary-container bg-surface-container-high' : 'border-white/10 bg-surface-container'}`}>
                          <div className="flex items-start justify-between gap-2">
                            <span className={`rounded-full bg-white/5 px-3 py-1.5 text-[11px] font-bold ${presentation.tone}`}>{presentation.label}</span>
                            <span className="material-symbols-outlined text-lg text-on-surface-variant/70">restaurant_menu</span>
                          </div>
                          <div className="flex flex-1 flex-col items-center justify-center text-center">
                            <FoodPhoto food={food} className="random-page-card-photo h-32 w-full overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-primary-container/15 to-secondary/10" />
                            <h3 className="random-page-card-title mt-3 line-clamp-2 text-lg font-extrabold leading-snug">{food.name}</h3>
                          </div>
                          <div className="flex flex-wrap items-center justify-center gap-2 border-t border-white/10 pt-3 text-xs text-on-surface-variant">
                            {food.avgPriceRange && <span>Giá {priceLabel[food.avgPriceRange] || food.avgPriceRange}</span>}
                            {food.avgPriceRange && food.mealTime && <span aria-hidden="true">•</span>}
                            {food.mealTime && <span>Buổi {mealLabel[food.mealTime] || food.mealTime}</span>}
                          </div>
                        </article>
                      );
                    }))}
                  </div>
                ) : (
                  <div className="flex h-[305px] items-center justify-center px-4 text-center text-sm text-on-surface-variant">
                    {isLoading ? 'Đang tải món ăn...' : error ? 'Không tải được vòng quay.' : 'Chưa có món phù hợp trong dữ liệu.'}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-1 flex items-center justify-between gap-3">
              <button type="button" aria-label="Món trước" onClick={() => move(-1)} disabled={isLoading || spinning || !count}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-surface-container-high text-on-surface disabled:opacity-40">
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <div className="flex min-w-0 flex-1 flex-col items-center gap-2">
                <span className="text-xs font-semibold text-on-surface-variant">{count ? `${activeIndex + 1} / ${count}` : '0 / 0'}</span>
                <div className="h-1.5 w-24 overflow-hidden rounded-full bg-outline/40" aria-hidden="true">
                  <div className="h-full rounded-full bg-primary-container transition-all" style={{ width: `${count ? ((activeIndex + 1) / count) * 100 : 0}%` }} />
                </div>
              </div>
              <button type="button" aria-label="Món tiếp" onClick={() => move(1)} disabled={isLoading || spinning || !count}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-surface-container-high text-on-surface disabled:opacity-40">
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>

            {(error || spinError) && <p className="mt-4 rounded-xl bg-error/10 p-3 text-center text-sm text-error" role="alert">{spinError || 'Không tải được món ăn. Hãy thử tải lại trang.'}</p>}

            <button type="button" onClick={spin} disabled={isLoading || spinning || !count}
              className="random-page-spin mt-6 flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary-container via-[#ff8249] to-[#ff9b63] px-5 text-base font-extrabold text-on-primary-container shadow-[0_12px_30px_rgba(255,107,53,0.32)] transition-transform active:scale-[0.98] disabled:opacity-50">
              <span className="material-symbols-outlined text-[22px]" aria-hidden="true">casino</span>
              {spinning ? 'Đang quay...' : 'Quay chọn món'}
            </button>
            {selected && !modalOpen && <button type="button" onClick={() => setModalOpen(true)} className="mt-3 w-full py-2 text-center text-sm font-semibold text-primary">Xem món vừa chọn: {selected.name}</button>}
          </div>
        </section>
        <p className="random-page-footnote mt-4 text-center text-xs leading-relaxed text-on-surface-variant">Các món trên vòng quay và kết quả đều lấy từ dữ liệu của hệ thống.</p>
      </div>

      {modalOpen && selected && (
        <div className="fixed inset-0 z-[1100] flex items-end justify-center bg-black/75 px-3 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm sm:items-center sm:p-5"
          onClick={() => setModalOpen(false)}>
          <div role="dialog" aria-modal="true" aria-labelledby="random-result-title" onClick={(event) => event.stopPropagation()}
            className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-t-[30px] border border-primary-container/30 bg-surface-container-high p-6 shadow-[0_24px_70px_rgba(0,0,0,0.6)] sm:rounded-[30px]">
            <div className="flex items-start justify-between gap-3">
              <span className="rounded-full bg-primary-container/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary">Món được chọn</span>
              <button type="button" onClick={() => setModalOpen(false)} aria-label="Đóng kết quả" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10">
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
            <div className="mt-3 text-center">
              <FoodPhoto food={selected} className="random-page-result-photo mx-auto h-40 w-full overflow-hidden rounded-[24px] bg-gradient-to-br from-primary-container/25 to-secondary/15" />
              <h2 id="random-result-title" className="mt-4 text-2xl font-extrabold">{selected.name}</h2>
              <div className="mt-3 flex flex-wrap justify-center gap-2 text-sm text-on-surface-variant">
                {selected.avgPriceRange && <span className="rounded-full bg-white/5 px-3 py-1">Giá {priceLabel[selected.avgPriceRange] || selected.avgPriceRange}</span>}
                {selected.mealTime && <span className="rounded-full bg-white/5 px-3 py-1">Buổi {mealLabel[selected.mealTime] || selected.mealTime}</span>}
              </div>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {selected.tags.map((tag) => <span key={tag} className="rounded-full border border-white/10 px-3 py-1 text-xs text-on-surface-variant">{tag}</span>)}
              </div>
            </div>
            <button type="button" onClick={() => navigate(`/map?search=${encodeURIComponent(selected.name)}`)}
              className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-primary-container px-4 font-bold text-white">
              <span className="material-symbols-outlined">location_on</span>Tìm quán gần tôi
            </button>
            <button type="button" onClick={() => setModalOpen(false)} className="mt-2 min-h-11 w-full text-sm font-semibold text-on-surface-variant">Đóng để quay tiếp</button>
          </div>
        </div>
      )}
    </main>
  );
}
