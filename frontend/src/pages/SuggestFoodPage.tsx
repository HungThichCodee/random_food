import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useFoodStore } from '../stores/useFoodStore';
import { useUserStore } from '../stores/useUserStore';
import logoImg from '../assert/logo.png';
import { v4 as uuidv4 } from 'uuid';

interface SuggestionCard {
  id: string;
  name: string;
  desc: string;
  matchScore: number;
  rating: number;
  price: string;
  location: string;
  imageUrl: string;
  tags: string[];
}

const DEFAULT_SUGGESTIONS: SuggestionCard[] = [
  {
    id: 'com-tam-ba-ghien',
    name: 'Cơm Tấm Sườn Bì Chả Đặc Biệt',
    desc: 'Sườn nướng than hoa thơm lừng, ít mỡ, kèm chả hấp trứng vàng óng.',
    matchScore: 98,
    rating: 4.9,
    price: '55.000đ',
    location: '600m • Quán Ba Ghiền',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD-dPnzFArdtOhheKxmAh7W63OApH5ettxa387kpw5OGOrxJgbHHyFkbi7NzZhjJLj9w8Y6nTlhglmw5P1E9ZCZJIIK8GK5BA6uh__rIiyUj6UFOgqfSUIrpHR__mWSfiSizpy73vax2IVnTSpvj-6y0T_st9NJaGoYJCJOb8lJZBECyqEXJCOVaOhetfAJK_o53bw5D8aNcQhOoceYXbytGeyv9V_yidoLoOWnfLJOI3uMMXUfiSk6aw',
    tags: ['Ít dầu mỡ', 'Đậm vị tỏi ớt'],
  },
  {
    id: 'bun-bo-o-xuan',
    name: 'Bún Bò Huế Chả Cua Cay Nồng',
    desc: 'Nước dùng chuẩn gốc Huế hầm xương bò 8 tiếng, sa tế cay thơm cay mũi.',
    matchScore: 94,
    rating: 4.8,
    price: '50.000đ',
    location: '1.2km • Bún Bò O Xuân',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDTi1eLhMEsEOabTpoMkksRC9XUFbzKEULJx7zYcWdUOMRrIRlvw7DA2EUSWpKyOFb0DjuTQHkubL4JNuqrTy5x_0YW_f-eKpOx_jLDGdIYfXawAFNPdShmz6EW0G1zh2pwAV9kZLQVdiZ2QhMc3X4QPfldtGs5tFAMrsu2Q_mBq6za9LgmQS5xWxjWH5heCuPpbWot4hcnVty6xFr7RgKEg-AROHqwfBiZ5zjamVWXvHARSLmr8UH0Rw',
    tags: ['Cay nồng', 'Món nước'],
  },
  {
    id: 'cuon-sai-gon',
    name: 'Gỏi Cuốn Tôm Thịt & Nước Chấm Tương',
    desc: 'Tôm thịt tươi ngon cuốn rau sạch thanh mát, sốt bơ đậu phộng béo ngậy.',
    matchScore: 91,
    rating: 4.7,
    price: '40.000đ',
    location: '950m • Cuốn Sài Gòn',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC88Z6dvfE_GSnRc1pvo3FzvFeKG-FPY-pOT4473jX0gQ3YZRl25vqKz8kwoUlokCT79D7YgvPAIrOVD3J1oDqE_ZewJlj0eANgRGn9lUPHrCYrxiWtR6Kujg1_j7jU7Aw5wLGYRJdoAI4-i3G6Ga355tMDit_coOIbNhgubVWEnEixyomGu-8lxCKDKOUDfHrUu5fL2w7UtsBAaOcneM7ZD5TopTFrqTmm4l5P8AJKtfl3T5ZPKGFMMQ',
    tags: ['Healthy', 'Ít calo'],
  },
];

export default function SuggestFoodPage() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { profile } = useUserStore();
  const { fetchSuggestedFoods, isLoading, suggestedFoods, suggestMatchLevel, suggestRelaxed, suggestMessage, error, fetchTagCounts, tagCounts } = useFoodStore();

  // Filters state
  const [selectedMealTimes, setSelectedMealTimes] = useState<string[]>([]);
  const [selectedDishType, setSelectedDishType] = useState<string>('');
  const [selectedBudget, setSelectedBudget] = useState<string>('');
  const [selectedTastes, setSelectedTastes] = useState<string[]>([]);

  useEffect(() => {
    let sessionId = localStorage.getItem('foodMatch_sessionId');
    if (!sessionId) {
      sessionId = uuidv4();
      localStorage.setItem('foodMatch_sessionId', sessionId);
    }
    fetchTagCounts({
      sessionId,
      mealTimes: selectedMealTimes.length > 0 ? selectedMealTimes : undefined,
      priceRange: selectedBudget === 're' ? 'Re' : selectedBudget === 'cao' ? 'Cao' : selectedBudget === 'vua' ? 'Vua' : undefined,
      category: selectedDishType || undefined,
    });
  }, [selectedMealTimes, selectedDishType, selectedBudget, fetchTagCounts]);

  // Auto-deselect tags that have count 0
  useEffect(() => {
    if (Object.keys(tagCounts).length > 0) {
      setSelectedTastes(prev => prev.filter(t => (tagCounts[t] || 0) > 0));
    }
  }, [tagCounts]);

  const progress = React.useMemo(() => {
    let filled = 0;
    if (selectedMealTimes.length > 0) filled++;
    if (selectedDishType) filled++;
    if (selectedBudget) filled++;
    if (selectedTastes.length > 0) filled++;
    return Math.round((filled / 4) * 100);
  }, [selectedMealTimes, selectedDishType, selectedBudget, selectedTastes]);

  const [suggestions, setSuggestions] = useState<SuggestionCard[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [networkError, setNetworkError] = useState(false);

  useEffect(() => {
    if (suggestedFoods) {
      if (suggestedFoods.length > 0) {
        const apiSuggestions: SuggestionCard[] = suggestedFoods.map((f, idx) => ({
          id: f.id.toString(),
          name: f.name,
          desc: f.tags && f.tags.length > 0 ? f.tags.join(', ') : 'Món ngon mỗi ngày chuẩn vị',
          matchScore: 95 - idx * 3,
          rating: 0,
          price: f.avgPriceRange || 'Bình dân',
          location: 'Khám phá quán ngon quanh đây',
          imageUrl: DEFAULT_SUGGESTIONS[idx % DEFAULT_SUGGESTIONS.length].imageUrl,
          tags: f.tags || []
        }));
        setSuggestions(apiSuggestions);
      } else {
        setSuggestions([]);
      }
    }
  }, [suggestedFoods]);

  const changeLanguage = () => {
    const nextLang = i18n.language === 'en' ? 'vi' : 'en';
    i18n.changeLanguage(nextLang);
  };

  const toggleMealTime = (val: string) => {
    setSelectedMealTimes(prev =>
      prev.includes(val) ? prev.filter(item => item !== val) : [...prev, val]
    );
  };

  const toggleTaste = (val: string) => {
    setSelectedTastes(prev =>
      prev.includes(val) ? prev.filter(item => item !== val) : [...prev, val]
    );
  };

  const handleFindDishes = async () => {
    setIsSubmitting(true);
    setNetworkError(false);
    let sessionId = localStorage.getItem('foodMatch_sessionId');
    if (!sessionId) {
      sessionId = uuidv4();
      localStorage.setItem('foodMatch_sessionId', sessionId);
    }

    try {
      await fetchSuggestedFoods({
        sessionId,
        mealTimes: selectedMealTimes.length > 0 ? selectedMealTimes : undefined,
        priceRange: selectedBudget === 're' ? 'Re' : selectedBudget === 'cao' ? 'Cao' : selectedBudget === 'vua' ? 'Vua' : undefined,
        category: selectedDishType || undefined,
        includedTags: selectedTastes,
      });
    } catch (e) {
      console.error('Network or server error:', e);
      setNetworkError(true);
      setSuggestions(DEFAULT_SUGGESTIONS);
    }

    setTimeout(() => {
      setIsSubmitting(false);
      const resultsEl = document.getElementById('results-section');
      if (resultsEl) {
        resultsEl.scrollIntoView({ behavior: 'smooth' });
      }
    }, 400);
  };

  return (
    <div className="bg-surface font-body-md text-body-md text-on-surface flex flex-col min-h-screen relative overflow-x-hidden selection:bg-primary-container selection:text-white">
      {/* Background ambient glows */}
      <div className="fixed -top-24 -right-24 w-80 h-80 rounded-full bg-primary-container/10 blur-[100px] pointer-events-none z-0"></div>
      <div className="fixed top-1/2 -left-24 w-72 h-72 rounded-full bg-secondary-container/10 blur-[90px] pointer-events-none z-0"></div>

      {/* Header */}
      <header className="fixed top-0 w-full z-50 pt-safe bg-surface/85 backdrop-blur-xl shadow-[0_1px_16px_rgba(0,0,0,0.35)]">
        <div className="h-16 px-margin flex items-center justify-between gap-space-sm">
          <div className="flex items-center gap-space-sm">
            <button
              onClick={() => navigate(-1)}
              className="w-11 h-11 flex items-center justify-center rounded-full bg-surface-container/60 text-on-surface hover:bg-surface-container transition-colors active:scale-95"
              aria-label="Quay lại"
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back_ios_new</span>
            </button>
            <img
              alt="Food Match Brand Icon"
              className="h-7 w-auto object-contain cursor-pointer"
              src={logoImg}
              onClick={() => navigate('/')}
            />
            <h1 className="font-title-md text-title-md text-on-surface tracking-tight truncate max-w-[170px] font-bold">
              {t('nav.suggest', 'Gợi ý món')}
            </h1>
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
              className="w-11 h-11 flex items-center justify-center rounded-full bg-surface-container/60 text-on-surface-variant hover:text-on-surface transition-colors"
              aria-label="Thêm tùy chọn"
            >
              <span className="material-symbols-outlined text-[20px]">more_vert</span>
            </button>
            <button 
              onClick={() => navigate('/profile')}
              className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-primary-container/40"
              aria-label="Cá nhân"
            >
              {profile?.displayName ? (
                <div className="w-full h-full bg-primary-container/20 text-primary-container flex items-center justify-center font-bold text-xs">
                  {profile.displayName.charAt(0).toUpperCase()}
                </div>
              ) : (
                <img
                  alt="Profile"
                  className="w-full h-full object-cover"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuA92w28fcnzXyfesyI7ypUuEyvf1p5UPHUIovJr0yN3HicG5VCbxRdTRqP8aAwKlfnlhMLCncSiYqORv_MxWipkJB1b9n_O8sG9etzaq9kZOts8_xz3QTUL_JfdrZZbp1UV_uTJhwITx1N4bFcWMVrDw_di98xQ1cB-L3b3B0NlJwYBkMHPRk4EaGQn6Q8wDMKrfj0WCGLW-TAedGPY6d01D6SDUbgOf27W9rMwxnDGvs8VhVmGf2c7RA"
                />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-col relative w-full pt-16 pb-28 bg-surface z-10 min-h-screen">
        <div className="flex flex-col w-full px-margin pb-10 space-y-space-lg">
          
          {/* Form Filter Sheet Container */}
          <div className="bg-surface-container/70 backdrop-blur-xl rounded-2xl p-space-md shadow-xl flex flex-col space-y-space-md relative overflow-hidden border border-white/5 mt-2">
            
            {/* Step Progress Header */}
            <div className="flex flex-col space-y-space-xs">
              <div className="flex items-center justify-between text-body-sm">
                <span className="font-label-md text-label-md text-primary flex items-center gap-1.5 font-bold">
                  <span className="material-symbols-outlined text-[16px]">tune</span>
                  Bước 3/4: Thiết lập khẩu vị
                </span>
                <span className="font-label-sm text-label-sm text-on-surface-variant font-bold">{progress}% hoàn tất</span>
              </div>
              <div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary-container rounded-full shadow-[0_0_12px_rgba(255,107,53,0.8)] transition-all duration-500"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>

            {/* 1. Bữa ăn trong ngày */}
            <div className="space-y-space-xs">
              <label className="font-label-md text-label-md text-on-surface flex items-center gap-1.5 font-bold">
                <span className="material-symbols-outlined text-[16px] text-tertiary">schedule</span>
                1. Bữa ăn trong ngày
              </label>
              <div className="flex flex-wrap gap-2 pt-1" id="filter-meal-time">
                {[
                  { key: 'Sang', emoji: '🌅', label: 'Sáng' },
                  { key: 'Trua', emoji: '☀️', label: 'Trưa' },
                  { key: 'Toi', emoji: '🌆', label: 'Chiều tối' },
                  { key: 'Khuya', emoji: '🌙', label: 'Ăn đêm' },
                ].map(item => {
                  const isActive = selectedMealTimes.includes(item.key);
                  return (
                    <button
                      key={item.key}
                      onClick={() => toggleMealTime(item.key)}
                      type="button"
                      className={`px-3.5 py-2 rounded-full font-label-md text-label-md transition-all flex items-center gap-1.5 active:scale-95 ${
                        isActive
                          ? 'bg-primary-container text-white shadow-[0_0_16px_rgba(255,107,53,0.45)] font-bold'
                          : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-bright'
                      }`}
                    >
                      <span>{item.emoji}</span>
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Thể loại món */}
            <div className="space-y-space-xs">
              <label className="font-label-md text-label-md text-on-surface flex items-center gap-1.5 font-bold">
                <span className="material-symbols-outlined text-[16px] text-secondary">ramen_dining</span>
                2. Thể loại món
              </label>
              <div className="flex flex-wrap gap-2 pt-1" id="filter-dish-type">
                {[
                  { key: 'nuoc', emoji: '🍜', label: 'Món nước' },
                  { key: 'com', emoji: '🍚', label: 'Cơm chắc bụng' },
                  { key: 'healthy', emoji: '🥗', label: 'Healthy • Salad' },
                  { key: 'an_vat', emoji: '🧇', label: 'Trà sữa & Ăn vặt' },
                ].map(item => {
                  const isActive = selectedDishType === item.key;
                  return (
                    <button
                      key={item.key}
                      onClick={() => setSelectedDishType(item.key)}
                      type="button"
                      className={`px-3.5 py-2 rounded-full font-label-md text-label-md transition-all flex items-center gap-1.5 active:scale-95 ${
                        isActive
                          ? 'bg-primary-container text-white shadow-[0_0_16px_rgba(255,107,53,0.45)] font-bold'
                          : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-bright'
                      }`}
                    >
                      <span>{item.emoji}</span>
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Mức ngân sách mỗi người */}
            <div className="space-y-space-xs">
              <label className="font-label-md text-label-md text-on-surface flex items-center gap-1.5 font-bold">
                <span className="material-symbols-outlined text-[16px] text-tertiary">payments</span>
                3. Mức ngân sách mỗi người
              </label>
              <div className="flex flex-wrap gap-2 pt-1" id="filter-budget">
                {[
                  { key: 're', emoji: '💰', label: 'Tiết kiệm (<35k)' },
                  { key: 'vua', emoji: '🍔', label: 'Bình dân (35k - 70k)' },
                  { key: 'cao', emoji: '🍾', label: 'Đổi gió (>150k)' },
                ].map(item => {
                  const isActive = selectedBudget === item.key;
                  return (
                    <button
                      key={item.key}
                      onClick={() => setSelectedBudget(item.key)}
                      type="button"
                      className={`px-3.5 py-2 rounded-full font-label-md text-label-md transition-all flex items-center gap-1.5 active:scale-95 ${
                        isActive
                          ? 'bg-primary-container text-white shadow-[0_0_16px_rgba(255,107,53,0.45)] font-bold'
                          : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-bright'
                      }`}
                    >
                      <span>{item.emoji}</span>
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Thẻ khẩu vị & Đặc trưng */}
            <div className="space-y-space-xs">
              <label className="font-label-md text-label-md text-on-surface flex items-center gap-1.5 font-bold">
                <span className="material-symbols-outlined text-[16px] text-error">local_fire_department</span>
                4. Thẻ khẩu vị &amp; Đặc trưng
              </label>
              <div className="flex flex-wrap gap-2 pt-1" id="filter-taste">
                {[
                  { key: 'Cay', emoji: '🌶️', label: 'Cay nồng' },
                  { key: 'Chay', emoji: '🥬', label: 'Ăn chay' },
                  { key: 'Healthy', emoji: '🥑', label: 'Healthy / Ít béo' },
                  { key: 'Ngọt', emoji: '🍰', label: 'Hảo ngọt' },
                  { key: 'Mặn', emoji: '🧂', label: 'Đậm đà' },
                  { key: 'Nướng', emoji: '🥩', label: 'Đồ nướng' },
                ].map(item => {
                  const isActive = selectedTastes.includes(item.key);
                  const hasData = Object.keys(tagCounts).length > 0;
                  const count = hasData ? (tagCounts[item.key] || tagCounts[item.label] || 0) : null;
                  const isDisabled = hasData && count === 0;

                  return (
                    <button
                      key={item.key}
                      onClick={() => !isDisabled && toggleTaste(item.key)}
                      type="button"
                      disabled={isDisabled}
                      title={isDisabled ? "Không có món nào khớp với lựa chọn hiện tại" : ""}
                      className={`px-3.5 py-2 rounded-full font-label-md text-label-md transition-all flex items-center gap-1.5 ${isDisabled ? 'opacity-40 cursor-not-allowed' : 'active:scale-95'} ${
                        isActive
                          ? 'bg-secondary-container text-on-secondary-container font-bold shadow-[0_0_14px_rgba(0,177,163,0.4)]'
                          : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-bright'
                      }`}
                    >
                      <span>{item.emoji}</span>
                      <span>{item.label}</span>
                      {count !== null && !isDisabled && <span className="ml-1 text-[11px] opacity-60">({count})</span>}
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Big CTA Button */}
          <button
            onClick={handleFindDishes}
            disabled={isSubmitting || isLoading}
            className="w-full py-4 px-space-md bg-gradient-to-r from-primary-container via-primary-container to-inverse-primary rounded-full text-white font-label-lg text-label-lg shadow-[0_6px_28px_rgba(255,107,53,0.45)] hover:shadow-[0_8px_32px_rgba(255,107,53,0.6)] flex items-center justify-center gap-2 transform active:scale-95 transition-all disabled:opacity-75 font-bold"
            id="find-dishes-btn"
            type="button"
          >
            <span className="material-symbols-outlined text-[22px]">bolt</span>
            <span>{isSubmitting || isLoading ? 'Đang Lọc Món...' : 'Tìm Món Chuẩn Gu Ngay'}</span>
          </button>

          {/* Suggestions Section */}
          <div id="results-section" className="flex flex-col space-y-space-md pt-2">
            
            {networkError && (
              <div className="bg-error/10 border border-error/20 p-3 rounded-lg flex items-start gap-2">
                <span className="material-symbols-outlined text-error">wifi_off</span>
                <p className="text-body-sm text-error font-medium">Không kết nối được với máy chủ. Đây là các gợi ý phổ biến cho bạn.</p>
              </div>
            )}

            {!networkError && suggestMatchLevel === 'empty' && (
              <div className="bg-surface-container-high border border-white/5 p-6 rounded-2xl flex flex-col items-center justify-center text-center space-y-3">
                <span className="material-symbols-outlined text-[48px] text-on-surface-variant">search_off</span>
                <h3 className="font-title-md text-title-md text-on-surface font-bold">Không tìm thấy món</h3>
                <p className="text-body-sm text-on-surface-variant">Rất tiếc, hệ thống không tìm thấy món nào khớp với loại món bạn chọn. Hãy thử đổi loại món khác nhé!</p>
              </div>
            )}

            {!networkError && (suggestMatchLevel === 'relaxed' || suggestMatchLevel === 'dishTypeOnly') && (
              <div className="bg-secondary-container/30 border border-secondary/30 p-3 rounded-lg flex items-start gap-2">
                <span className="material-symbols-outlined text-secondary">info</span>
                <p className="text-body-sm text-on-surface font-medium">{suggestMessage}</p>
              </div>
            )}

            {suggestions.length > 0 && suggestMatchLevel !== 'empty' && (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[22px]">auto_awesome</span>
                    <h2 className="font-headline-md text-headline-md text-on-surface font-bold">Khớp Nhất Với Bạn</h2>
                  </div>
                  <span className="font-label-sm text-label-sm px-2.5 py-1 rounded-full bg-surface-container-high text-secondary font-semibold">
                    {suggestions.length} gợi ý hot
                  </span>
                </div>

                {/* Recommendation Cards */}
                <div className="flex flex-col space-y-space-md">
                  {suggestions.map(dish => (
                    <article
                      key={dish.id}
                      className="bg-surface-container/75 backdrop-blur-md rounded-2xl overflow-hidden shadow-lg flex flex-col group border border-white/5"
                    >
                      <div className="relative w-full h-44 overflow-hidden">
                        <img
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          alt={dish.name}
                      src={dish.imageUrl}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-surface-container via-transparent to-black/30"></div>
                    
                    {/* Match Score Badge */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-surface-container-lowest/80 backdrop-blur-md text-secondary-fixed-dim font-label-md text-label-md px-3 py-1 rounded-full font-bold">
                      <span className="material-symbols-outlined text-[16px] text-secondary">verified</span>
                      <span>{dish.matchScore}% Hợp gu</span>
                    </div>

                    {/* Rating Badge - Hidden if no real rating */}
                    {dish.rating > 0 && (
                      <div className="absolute top-3 right-3 flex items-center gap-1 bg-surface-container-lowest/80 backdrop-blur-md text-tertiary-fixed font-label-md text-label-md px-2.5 py-1 rounded-full font-bold">
                        <span className="material-symbols-outlined text-[15px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                        <span>{dish.rating}</span>
                      </div>
                    )}

                    {/* Price and Distance */}
                    <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                      <span className="font-label-lg text-label-lg text-primary font-bold bg-surface-container-lowest/80 px-2.5 py-1 rounded-full">
                        {t(`price.${dish.price.toLowerCase()}`, { defaultValue: dish.price })}
                      </span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1 bg-surface-container-lowest/70 backdrop-blur-sm px-2 py-0.5 rounded-full">
                        <span className="material-symbols-outlined text-[14px] text-primary">near_me</span>
                        {dish.location}
                      </span>
                    </div>
                  </div>

                  <div className="p-space-md flex flex-col space-y-space-sm">
                    <div>
                      <h3 className="font-title-md text-title-md text-on-surface line-clamp-1 font-bold">
                        {i18n.language === 'en' && t(`foodNames.${dish.name}`, { defaultValue: dish.name }) !== dish.name 
                          ? t(`foodNames.${dish.name}`) 
                          : dish.name}
                      </h3>
                      <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-1 pt-0.5">
                        {dish.desc}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {dish.tags.map(tag => (
                          <span
                            key={tag}
                            className="font-label-sm text-label-sm bg-surface-container-high text-on-surface px-2.5 py-0.5 rounded-full"
                          >
                            {t(`tags.${tag.toLowerCase()}`, { defaultValue: tag })}
                          </span>
                        ))}
                      </div>
                      <button
                        onClick={() => navigate(`/map?search=${encodeURIComponent(dish.name)}`)}
                        className="px-3.5 py-1.5 rounded-full bg-secondary-container/20 text-secondary hover:bg-secondary-container/30 transition-colors font-label-md text-label-md flex items-center gap-1 font-bold shrink-0"
                        type="button"
                      >
                        <span>Xem quán</span>
                        <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </div>

        </div>
      </main>
    </div>
  );
}
