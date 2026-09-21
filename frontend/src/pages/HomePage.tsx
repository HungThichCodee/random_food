import { Typography, Space, Card } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const { Title, Paragraph } = Typography;

export default function HomePage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div style={{ textAlign: 'center', padding: '2rem' }}>
      <Title>{t('app.title')}</Title>
      <Paragraph>{t('app.subtitle')}</Paragraph>
      <Space direction="vertical" size="large">
        {/* TODO: Add feature cards with navigation */}
        <Card hoverable onClick={() => navigate('/random')}>
          <Title level={4}>{t('nav.random')}</Title>
        </Card>
        <Card hoverable onClick={() => navigate('/suggest')}>
          <Title level={4}>{t('nav.suggest')}</Title>
        </Card>
        <Card hoverable onClick={() => navigate('/map')}>
          <Title level={4}>{t('nav.map')}</Title>
        </Card>
        <Card hoverable onClick={() => navigate('/profile')}>
          <Title level={4}>{t('nav.findBuddy')}</Title>
        </Card>
      </Space>
    </div>
  );
}
