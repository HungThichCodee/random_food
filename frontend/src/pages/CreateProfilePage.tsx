import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { tempUserApi } from '../api/tempUserApi';
import { useUserStore } from '../stores/useUserStore';
import type { CreateTempUserDto } from '../types/tempUser';
import logoImg from '../assert/logo.png';

interface TasteTag {
  id: string;
  label: string;
  emoji: string;
  theme: 'orange' | 'teal' | 'yellow';
}

const AVAILABLE_TAGS: TasteTag[] = [
  { id: 'cay', label: 'Nghiện đồ cay', emoji: '🌶️', theme: 'orange' },
  { id: 'nuong', label: 'Đồ nướng vỉa hè', emoji: '🥢', theme: 'orange' },
  { id: 'cafe', label: 'Cà phê la cà', emoji: '☕', theme: 'teal' },
  { id: 'healthy', label: 'Eat Clean / Healthy', emoji: '🥗', theme: 'teal' },
  { id: 'nuoc_leo', label: 'Thích húp nước lèo', emoji: '🍲', theme: 'orange' },
  { id: 'beo_ngay', label: 'Phô mai béo ngậy', emoji: '🧀', theme: 'yellow' },
  { id: 'che_ngot', label: 'Chè & bánh ngọt', emoji: '🍧', theme: 'yellow' },
];

const FUN_NICKNAMES = [
  'Chiến Thần Húp Phở',
  'Bé Mập Nghiện Trà Sữa',
  'Thích Ăn Cay Xé Lưỡi',
  'Tiên Tử Ốc Sài Gòn',
  'Trùm Săn Quán Lạ',
  'Nữ Hoàng Phô Mai',
  'Thánh Ăn Vặt Sài Thành',
  'Dân Chơi Bún Đậu',
  'Bậc Thầy Cơm Tấm',
  'Mì Gói Say Mê',
];

export default function CreateProfilePage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { profile, setProfile, toggleVisibilityLocally, clearProfile } = useUserStore();

  const [displayName, setDisplayName] = useState(profile?.displayName || 'Mì Gói Say Mê');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>((profile?.gender as any) || 'Female');
  const [selectedTags, setSelectedTags] = useState<string[]>(
    profile?.foodPreferences?.length ? profile.foodPreferences : ['cay', 'nuong', 'cafe', 'nuoc_leo', 'che_ngot']
  );
  const [desiredFood, setDesiredFood] = useState(profile?.desiredFood || 'Phở bò sốt vang nóng hổi');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [diceRolling, setDiceRolling] = useState(false);
  const [successToast, setSuccessToast] = useState(false);

  const changeLanguage = () => {
    const nextLang = i18n.language === 'en' ? 'vi' : 'en';
    i18n.changeLanguage(nextLang);
  };

  const handleRandomNickname = () => {
    setDiceRolling(true);
    const randomIndex = Math.floor(Math.random() * FUN_NICKNAMES.length);
    setDisplayName(FUN_NICKNAMES[randomIndex]);
    setTimeout(() => setDiceRolling(false), 350);
  };

  const handleToggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!displayName.trim()) {
      setErrorMessage(t('profile.displayNameRequired', 'Vui lòng nhập biệt danh khi đi ăn!'));
      return;
    }
    setErrorMessage(null);
    setLoading(true);

    try {
      const dto: CreateTempUserDto = {
        displayName: displayName.trim(),
        gender,
        foodPreferences: selectedTags,
        desiredFood: desiredFood.trim() || undefined,
      };

      const user = await tempUserApi.create(dto);
      setProfile(user);
      toggleVisibilityLocally(true);

      setSuccessToast(true);
      setTimeout(() => {
        navigate('/map');
      }, 900);
    } catch (error: any) {
      console.error('Error creating profile', error);
      setErrorMessage(error?.response?.data?.message || t('common.error', 'Đã có lỗi xảy ra. Vui lòng thử lại!'));
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    if (!displayName.trim()) {
      setDisplayName('Người Yêu Ẩm Thực');
    }
    navigate('/map');
  };

  const handleReset = () => {
    clearProfile();
    setDisplayName('Mì Gói Say Mê');
    setGender('Female');
    setSelectedTags(['cay', 'nuong', 'cafe', 'nuoc_leo', 'che_ngot']);
    setDesiredFood('Phở bò sốt vang nóng hổi');
  };

  return (
    <div className="bg-surface font-body-md text-body-md text-on-surface flex flex-col min-h-screen relative overflow-x-hidden selection:bg-primary-container selection:text-white pt-safe pb-28">
      {/* Subtle Ambient Glow Orbs */}
      <div className="fixed -top-16 -left-20 w-72 h-72 rounded-full bg-primary-container/10 blur-3xl pointer-events-none z-0"></div>
      <div className="fixed top-80 -right-24 w-80 h-80 rounded-full bg-secondary/10 blur-3xl pointer-events-none z-0"></div>

      {/* Main Content Container */}
      <main className="flex flex-col relative w-full bg-transparent min-h-screen z-10">
        <div className="flex flex-col w-full relative pb-12 overflow-x-hidden">
          <div className="flex flex-col w-full px-space-md pt-space-md space-y-6 relative z-10">
            
            {/* Header & Step Indicator */}
            <header className="flex flex-col w-full space-y-3">
              <div className="flex items-center justify-between">
                <div 
                  className="flex items-center space-x-2.5 cursor-pointer"
                  onClick={() => navigate('/')}
                >
                  <div className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center shadow-md overflow-hidden relative ring-1 ring-white/10">
                    <img 
                      alt="Food Match Brand Icon" 
                      className="w-full h-full object-cover" 
                      src={logoImg} 
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-label-sm text-label-sm text-secondary tracking-wider uppercase font-semibold">
                      Food Match
                    </span>
                    <span className="font-title-md text-title-md text-on-surface leading-tight font-bold">
                      {t('profile.title', 'Hồ Sơ Ẩm Thực')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {/* Language Switcher */}
                  <button
                    type="button"
                    onClick={changeLanguage}
                    className="px-2.5 h-7 flex items-center justify-center rounded-full bg-surface-container/80 text-primary-container hover:bg-surface-container transition-colors font-bold text-label-sm uppercase border border-primary-container/20 active:scale-95"
                    title="Đổi ngôn ngữ (VN / EN)"
                  >
                    {i18n.language === 'en' ? 'EN' : 'VN'}
                  </button>

                  <div className="bg-surface-container-high px-3 py-1 rounded-full shadow-sm border border-white/5">
                    <span className="font-label-sm text-label-sm text-primary font-bold">Bước 2 / 3</span>
                  </div>
                </div>
              </div>

              {/* Glowing Neon Progress Bar */}
              <div className="flex flex-col space-y-1.5 w-full">
                <div className="w-full bg-surface-container-highest/60 rounded-full h-2 p-0.5 overflow-hidden backdrop-blur-sm">
                  <div className="h-full rounded-full bg-gradient-to-r from-primary-container via-primary to-tertiary w-2/3 shadow-[0_0_12px_rgba(255,107,53,0.7)] transition-all duration-700 ease-out"></div>
                </div>
                <div className="flex justify-between items-center text-on-surface-variant font-body-sm text-body-sm px-0.5">
                  <span>{t('profile.exploreTaste', 'Khám phá khẩu vị của bạn')}</span>
                  <span className="text-tertiary font-semibold font-label-sm text-label-sm">66%</span>
                </div>
              </div>

              {/* Encouraging Headline */}
              <div className="pt-1">
                <div className="flex items-center justify-between">
                  <h1 className="font-headline-md text-headline-md text-on-surface tracking-tight leading-snug">
                    Bật mí gu ăn uống của bạn! 🔥
                  </h1>
                  {profile && (
                    <button
                      type="button"
                      onClick={handleReset}
                      className="text-label-sm text-outline hover:text-error transition-colors flex items-center gap-1 active:scale-95"
                      title="Xóa hồ sơ và tạo lại"
                    >
                      <span className="material-symbols-outlined text-[15px]">refresh</span>
                      <span>Làm mới</span>
                    </button>
                  )}
                </div>
                <p className="font-body-md text-body-md text-on-surface-variant mt-1">
                  Tạo hồ sơ để Food Match ghép đôi bạn ăn hợp cạ &amp; gợi ý quán chuẩn vị ngay lập tức.
                </p>
              </div>
            </header>

            {/* Error Message Alert */}
            {errorMessage && (
              <div className="p-3 rounded-lg bg-error-container/40 border border-error/30 text-error flex items-center space-x-2 text-body-sm animate-pulse">
                <span className="material-symbols-outlined text-base">error</span>
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Success Toast Overlay */}
            {successToast && (
              <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-full bg-surface-container-highest/95 border border-primary-container text-primary-container font-bold text-body-md shadow-[0_0_24px_rgba(255,107,53,0.6)] flex items-center space-x-2 animate-bounce">
                <span className="material-symbols-outlined text-xl text-primary">check_circle</span>
                <span>Hồ sơ đã tạo thành công! Đang mở bản đồ...</span>
              </div>
            )}

            {/* Main Form Content */}
            <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
              
              {/* Field 1: Nickname Input */}
              <div className="bg-surface-container/70 backdrop-blur-md rounded-lg p-space-md shadow-md space-y-2.5 transition-all border border-white/5">
                <div className="flex items-center justify-between">
                  <label className="flex items-center space-x-2 text-on-surface font-title-md text-title-md font-semibold" htmlFor="nickname-input">
                    <span className="w-7 h-7 rounded-full bg-primary-container/20 text-primary-container flex items-center justify-center font-label-md text-label-md">
                      <span className="material-symbols-outlined text-base">person</span>
                    </span>
                    <span>{t('profile.displayName', 'Biệt danh khi đi ăn')}</span>
                  </label>
                  <span className="font-label-sm text-label-sm text-tertiary font-bold">Bắt buộc</span>
                </div>
                
                <div className="relative flex items-center">
                  <input
                    id="nickname-input"
                    className="w-full bg-surface-container-high/90 text-on-surface placeholder:text-outline/70 font-body-md text-body-md px-4 py-3 pr-12 rounded-DEFAULT focus:outline-none focus:bg-surface-container-highest focus:ring-1 focus:ring-primary-container/60 transition-all shadow-inner border border-white/5"
                    placeholder="Nhập biệt danh (vd: Phở Bò Nghiện Ớt, Bé Mập...)"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                  />
                  <button
                    aria-label="Gợi ý biệt danh ngẫu nhiên"
                    className={`absolute right-3 p-1.5 rounded-full text-secondary hover:bg-surface-bright active:scale-90 transition-all flex items-center justify-center ${
                      diceRolling ? 'rotate-180 scale-125 text-primary' : ''
                    }`}
                    type="button"
                    onClick={handleRandomNickname}
                    title="Bấm để tạo ngẫu nhiên tên vui nhộn"
                  >
                    <span className="material-symbols-outlined text-xl">casino</span>
                  </button>
                </div>

                <p className="font-body-sm text-body-sm text-on-surface-variant flex items-center space-x-1">
                  <span className="material-symbols-outlined text-sm text-primary">diversity_1</span>
                  <span>Hiển thị cho bạn bè xung quanh khi gửi lời mời ăn chung.</span>
                </p>
              </div>

              {/* Field 2: Gender Selection Cards */}
              <div className="bg-surface-container/70 backdrop-blur-md rounded-lg p-space-md shadow-md space-y-3 border border-white/5">
                <div className="flex items-center justify-between">
                  <span className="flex items-center space-x-2 text-on-surface font-title-md text-title-md font-semibold">
                    <span className="w-7 h-7 rounded-full bg-secondary/20 text-secondary flex items-center justify-center font-label-md text-label-md">
                      <span className="material-symbols-outlined text-base">face</span>
                    </span>
                    <span>{t('profile.gender', 'Giới tính của bạn')}</span>
                  </span>
                  <span className="font-label-sm text-label-sm text-outline">Để ghép đôi chuẩn</span>
                </div>

                <div className="grid grid-cols-3 gap-2.5" id="gender-group">
                  {/* Male Option */}
                  <button
                    type="button"
                    onClick={() => setGender('Male')}
                    className={`gender-pill flex flex-col items-center justify-center py-3.5 px-2 rounded-DEFAULT transition-all active:scale-95 group relative border ${
                      gender === 'Male'
                        ? 'bg-gradient-to-b from-primary-container/20 to-surface-container-highest shadow-[0_0_16px_rgba(255,107,53,0.3)] border-primary-container/60'
                        : 'bg-surface-container-high hover:bg-surface-container-highest border-white/5'
                    }`}
                  >
                    {gender === 'Male' && (
                      <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-primary-container text-on-primary flex items-center justify-center shadow-md">
                        <span className="material-symbols-outlined text-xs font-bold">check</span>
                      </div>
                    )}
                    <span className={`text-2xl mb-1 transition-transform ${gender === 'Male' ? 'scale-110' : 'group-hover:scale-110'}`}>
                      👨
                    </span>
                    <span className={`font-label-md text-label-md ${gender === 'Male' ? 'text-primary font-bold' : 'text-on-surface font-medium'}`}>
                      Nam
                    </span>
                  </button>

                  {/* Female Option */}
                  <button
                    type="button"
                    onClick={() => setGender('Female')}
                    className={`gender-pill flex flex-col items-center justify-center py-3.5 px-2 rounded-DEFAULT transition-all active:scale-95 relative border ${
                      gender === 'Female'
                        ? 'bg-gradient-to-b from-primary-container/20 to-surface-container-highest shadow-[0_0_16px_rgba(255,107,53,0.3)] border-primary-container/60'
                        : 'bg-surface-container-high hover:bg-surface-container-highest border-white/5'
                    }`}
                  >
                    {gender === 'Female' && (
                      <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-primary-container text-on-primary flex items-center justify-center shadow-md">
                        <span className="material-symbols-outlined text-xs font-bold">check</span>
                      </div>
                    )}
                    <span className={`text-2xl mb-1 transition-transform ${gender === 'Female' ? 'scale-110' : 'group-hover:scale-110'}`}>
                      👩
                    </span>
                    <span className={`font-label-md text-label-md ${gender === 'Female' ? 'text-primary font-bold' : 'text-on-surface font-medium'}`}>
                      Nữ
                    </span>
                  </button>

                  {/* Other Option */}
                  <button
                    type="button"
                    onClick={() => setGender('Other')}
                    className={`gender-pill flex flex-col items-center justify-center py-3.5 px-2 rounded-DEFAULT transition-all active:scale-95 group relative border ${
                      gender === 'Other'
                        ? 'bg-gradient-to-b from-primary-container/20 to-surface-container-highest shadow-[0_0_16px_rgba(255,107,53,0.3)] border-primary-container/60'
                        : 'bg-surface-container-high hover:bg-surface-container-highest border-white/5'
                    }`}
                  >
                    {gender === 'Other' && (
                      <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-primary-container text-on-primary flex items-center justify-center shadow-md">
                        <span className="material-symbols-outlined text-xs font-bold">check</span>
                      </div>
                    )}
                    <span className={`text-2xl mb-1 transition-transform ${gender === 'Other' ? 'scale-110' : 'group-hover:scale-110'}`}>
                      🌈
                    </span>
                    <span className={`font-label-md text-label-md ${gender === 'Other' ? 'text-primary font-bold' : 'text-on-surface font-medium'}`}>
                      Khác
                    </span>
                  </button>
                </div>
              </div>

              {/* Field 3: Food Preferences Multi-Tag Select */}
              <div className="bg-surface-container/70 backdrop-blur-md rounded-lg p-space-md shadow-md space-y-3 border border-white/5">
                <div className="flex items-center justify-between">
                  <span className="flex items-center space-x-2 text-on-surface font-title-md text-title-md font-semibold">
                    <span className="w-7 h-7 rounded-full bg-tertiary/20 text-tertiary flex items-center justify-center font-label-md text-label-md">
                      <span className="material-symbols-outlined text-base">restaurant</span>
                    </span>
                    <span>{t('profile.preferences', 'Sở thích ẩm thực')}</span>
                  </span>
                  <span className="font-label-sm text-label-sm text-primary font-semibold" id="selected-count">
                    {selectedTags.length} đã chọn
                  </span>
                </div>

                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Chọn tối thiểu 3 khẩu vị bạn thích để tìm bạn chung mâm chuẩn gout:
                </p>

                {/* Dynamic Filter Multi-Pills */}
                <div className="flex flex-wrap gap-2 pt-1" id="taste-tags">
                  {AVAILABLE_TAGS.map((tag) => {
                    const isSelected = selectedTags.includes(tag.id);
                    
                    let activeClass = '';
                    if (isSelected) {
                      if (tag.theme === 'teal') {
                        activeClass = 'bg-secondary-container text-on-secondary-container shadow-[0_0_12px_rgba(79,219,204,0.35)] font-semibold';
                      } else if (tag.theme === 'yellow') {
                        activeClass = 'bg-tertiary-fixed text-on-tertiary-fixed shadow-[0_0_12px_rgba(227,198,51,0.35)] font-bold';
                      } else {
                        activeClass = 'bg-primary-container text-on-primary shadow-[0_0_12px_rgba(255,107,53,0.35)] font-semibold';
                      }
                    } else {
                      activeClass = 'bg-surface-container-high text-on-surface hover:bg-surface-container-highest border border-white/5';
                    }

                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => handleToggleTag(tag.id)}
                        className={`tag-item flex items-center space-x-1.5 px-3.5 py-2 rounded-full font-label-md text-label-md active:scale-95 transition-all ${activeClass}`}
                      >
                        <span>{tag.emoji}</span>
                        <span>{tag.label}</span>
                        {isSelected && (
                          <span className="material-symbols-outlined text-xs">close</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Field 4: Spotlight Desired Food Input */}
              <div className="bg-surface-container/70 backdrop-blur-md rounded-lg p-space-md shadow-md space-y-2.5 border border-white/5">
                <div className="flex items-center justify-between">
                  <label className="flex items-center space-x-2 text-on-surface font-title-md text-title-md font-semibold" htmlFor="crave-input">
                    <span className="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center font-label-md text-label-md">
                      <span className="material-symbols-outlined text-base">ramen_dining</span>
                    </span>
                    <span>{t('profile.desiredFood', 'Món đang thèm nhất hôm nay')}</span>
                  </label>
                  <span className="font-label-sm text-label-sm text-secondary flex items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary inline-block mr-1 animate-ping"></span>
                    Ưu tiên ghép đôi
                  </span>
                </div>

                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-lg pointer-events-none">🍜</span>
                  <input
                    id="crave-input"
                    className="w-full pl-10 pr-4 py-3 bg-surface-container-high/90 text-on-surface placeholder:text-outline/70 font-body-md text-body-md rounded-DEFAULT focus:outline-none focus:bg-surface-container-highest focus:ring-1 focus:ring-primary-container/60 transition-all shadow-inner border border-white/5"
                    placeholder="vd: Bún đậu mắm tôm, Bò né hoa quả sơn..."
                    type="text"
                    value={desiredFood}
                    onChange={(e) => setDesiredFood(e.target.value)}
                  />
                </div>
              </div>

              {/* Interactive Food Card Inspiration Snippet */}
              <div className="bg-gradient-to-r from-surface-container-high via-surface-container to-surface-container-high p-3.5 rounded-lg flex items-center space-x-3.5 shadow-sm border border-white/5">
                <div className="w-12 h-12 rounded-DEFAULT overflow-hidden flex-shrink-0 relative">
                  <img
                    alt="Pho bo bowl"
                    className="w-full h-full object-cover"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAq5SI4dYnfAx5hbG1PoX8LunnBukU8TjKtGaI7dRIpiakUa5AKWjU0MneyoCozlT1lsCLRvj4s_5eT-cgzGZ0RRaAa-Jn1EGJ7xjjlwh19U3i9_SuP-bto0W5MDPKZ9dqU9osysMolSvy4Z51IKgCMl0hrk_ESjXU6nVvHzHmo_0LD6miixmHuVhDIS-FjUFzriwhWR6VVmdkigKFN_YlFPnxz0XqqvLZocDPEHWqNsXkrXufCVAScdw"
                  />
                  <div className="absolute inset-0 bg-primary-container/10"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-label-md text-label-md text-primary font-semibold flex items-center">
                    <span className="material-symbols-outlined text-sm mr-1 text-secondary">magic_button</span>
                    Food Match AI đã nhận diện:
                  </p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant truncate">
                    Đang có 14 bạn quanh bạn cùng thèm “{desiredFood || 'Phở Bò & Món Nóng'}”!
                  </p>
                </div>
              </div>

              {/* Actions & CTA Section */}
              <div className="flex flex-col w-full pt-2 space-y-3">
                {/* Main Shimmer Neon Button */}
                <button
                  id="submit-profile-btn"
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 px-6 rounded-full font-title-md text-title-md text-white font-bold tracking-wide shadow-[0_4px_24px_rgba(255,107,53,0.5)] active:scale-95 hover:scale-[1.02] transition-all duration-300 relative overflow-hidden flex items-center justify-center space-x-2 bg-gradient-to-r from-[#FF6B35] via-[#FF8A5B] to-[#FFE14D] hover:shadow-[0_6px_30px_rgba(255,107,53,0.7)] disabled:opacity-75 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <span className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin mr-2"></span>
                      <span>Đang kết nối bạn ăn...</span>
                    </>
                  ) : (
                    <>
                      <span>{t('profile.submitBtn', 'Hoàn Tất & Bắt Đầu Khám Phá')}</span>
                      <span className="material-symbols-outlined text-xl">auto_awesome</span>
                    </>
                  )}
                </button>

                {/* Secondary Skip Action */}
                <button
                  type="button"
                  onClick={handleSkip}
                  className="w-full py-2.5 text-center font-label-lg text-label-lg text-on-surface-variant hover:text-on-surface transition-colors active:scale-95"
                >
                  {t('profile.skipBtn', 'Để sau, xem ứng dụng trước')}
                </button>
              </div>

            </form>

          </div>
        </div>
      </main>
    </div>
  );
}
