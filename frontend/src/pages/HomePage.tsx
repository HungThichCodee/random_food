import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Space, Card, Button } from 'antd-mobile';
import { FireFill, SearchOutline, LocationFill, UserOutline } from 'antd-mobile-icons';
import './HomePage.css';

export default function HomePage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="home-page">
      <div className="hero-section">
        <h1 className="neon-text-primary title">Random Food</h1>
        <p className="subtitle">{t('app.subtitle', 'What should we eat today?')}</p>
      </div>

      <div className="features-grid">
        <div className="glass-card feature-card" onClick={() => navigate('/random')}>
          <div className="icon-wrapper neon-text-primary">
            <FireFill fontSize={32} />
          </div>
          <h3>{t('nav.random', 'Pick Random')}</h3>
        </div>

        <div className="glass-card feature-card" onClick={() => navigate('/suggest')}>
          <div className="icon-wrapper neon-text-secondary">
            <SearchOutline fontSize={32} />
          </div>
          <h3>{t('nav.suggest', 'Suggest')}</h3>
        </div>

        <div className="glass-card feature-card" onClick={() => navigate('/map')}>
          <div className="icon-wrapper neon-text-primary">
            <LocationFill fontSize={32} />
          </div>
          <h3>{t('nav.map', 'Map')}</h3>
        </div>

        <div className="glass-card feature-card" onClick={() => navigate('/profile')}>
          <div className="icon-wrapper neon-text-secondary">
            <UserOutline fontSize={32} />
          </div>
          <h3>{t('nav.findBuddy', 'Find Buddy')}</h3>
        </div>
      </div>
    </div>
  );
}
