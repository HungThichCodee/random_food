import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './HomePage.css';

export default function HomePage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="home-page">
      {/* Ambient background glows — from Stitch design */}
      <div className="ambient-glow-primary" style={{ top: '-40px', left: '50%', transform: 'translateX(-50%)', width: '256px', height: '256px' }} />
      <div className="ambient-glow-secondary" style={{ top: '120px', left: '-48px', width: '192px', height: '192px' }} />
      <div style={{ position: 'absolute', top: '80px', right: '-48px', width: '192px', height: '192px', borderRadius: '50%', background: 'rgba(227, 198, 51, 0.08)', filter: 'blur(70px)', pointerEvents: 'none' }} />

      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-logo-wrapper">
          <div className="hero-logo-glow" />
          <div className="hero-logo-circle">
            <span className="material-symbols-outlined" style={{ fontSize: '56px', color: 'var(--primary-container)' }}>restaurant</span>
          </div>
          <div className="hero-logo-badge">
            <span className="material-symbols-outlined" style={{ fontSize: '14px', fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
          </div>
        </div>

        <h1 className="hero-title gradient-text-primary">Food Match</h1>
        <p className="hero-subtitle">{t('app.subtitle', 'Hôm nay ăn gì? Để chúng tôi quyết định.')}</p>
      </div>

      {/* Feature Cards Grid — 2×2 like Stitch */}
      <section className="features-grid">
        {/* Card 1: Random Món */}
        <div className="feature-card glass-card feature-card--orange" onClick={() => navigate('/random')}>
          <div className="feature-card__glow feature-card__glow--orange" />
          <div className="feature-card__header">
            <div className="feature-card__icon feature-card__icon--orange">
              <span>🎲</span>
            </div>
            <span className="material-symbols-outlined feature-card__arrow" style={{ color: 'var(--primary-container)' }}>arrow_forward</span>
          </div>
          <h2 className="feature-card__title text-title-md">{t('nav.random', 'Random Món')}</h2>
          <p className="feature-card__desc text-body-sm">{t('home.randomDesc', 'Không cần nghĩ, quay là trúng món ngon đậm vị')}</p>
          <div className="feature-card__cta" style={{ color: 'var(--primary)' }}>
            <span className="text-label-sm">{t('food.spinButton', 'Quay ngay')}</span>
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>casino</span>
          </div>
        </div>

        {/* Card 2: Tìm Quán */}
        <div className="feature-card glass-card feature-card--teal" onClick={() => navigate('/map')}>
          <div className="feature-card__glow feature-card__glow--teal" />
          <div className="feature-card__header">
            <div className="feature-card__icon feature-card__icon--teal">
              <span>🗺️</span>
            </div>
            <span className="material-symbols-outlined feature-card__arrow" style={{ color: 'var(--secondary)' }}>arrow_forward</span>
          </div>
          <h2 className="feature-card__title text-title-md">{t('nav.map', 'Tìm Quán')}</h2>
          <p className="feature-card__desc text-body-sm">{t('home.mapDesc', 'Quán ngon gần bạn trên bản đồ sống động')}</p>
          <div className="feature-card__cta" style={{ color: 'var(--secondary)' }}>
            <span className="text-label-sm">{t('home.explore', 'Khám phá')}</span>
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>near_me</span>
          </div>
        </div>

        {/* Card 3: Gợi Ý */}
        <div className="feature-card glass-card feature-card--yellow" onClick={() => navigate('/suggest')}>
          <div className="feature-card__glow feature-card__glow--yellow" />
          <div className="feature-card__header">
            <div className="feature-card__icon feature-card__icon--yellow">
              <span>🍽️</span>
            </div>
            <span className="material-symbols-outlined feature-card__arrow" style={{ color: 'var(--tertiary)' }}>tune</span>
          </div>
          <h2 className="feature-card__title text-title-md">{t('nav.suggest', 'Gợi Ý')}</h2>
          <p className="feature-card__desc text-body-sm">{t('home.suggestDesc', 'Tùy chọn theo ngân sách & khẩu vị riêng')}</p>
          <div className="feature-card__cta" style={{ color: 'var(--tertiary)' }}>
            <span className="text-label-sm">{t('home.setup', 'Thiết lập')}</span>
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>auto_awesome</span>
          </div>
        </div>

        {/* Card 4: Tìm Bạn Ăn */}
        <div className="feature-card glass-card feature-card--orange2" onClick={() => navigate('/profile')}>
          <div className="feature-card__glow feature-card__glow--orange2" />
          <div className="feature-card__header">
            <div className="feature-card__icon feature-card__icon--orange">
              <span>🫂</span>
            </div>
            <span className="material-symbols-outlined feature-card__arrow" style={{ color: 'var(--primary-container)' }}>arrow_forward</span>
          </div>
          <h2 className="feature-card__title text-title-md">{t('nav.findBuddy', 'Tìm Bạn Ăn')}</h2>
          <p className="feature-card__desc text-body-sm">{t('home.buddyDesc', 'Kết nối bạn cùng phường đang thèm ăn cùng')}</p>
          <div className="feature-card__cta" style={{ color: 'var(--primary)' }}>
            <span className="text-label-sm">{t('home.connect', 'Kết nối')}</span>
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>people</span>
          </div>
        </div>
      </section>
    </div>
  );
}
