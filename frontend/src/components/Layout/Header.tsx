import { Layout, Menu } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../Common/LanguageSwitcher';

const { Header } = Layout;

export default function AppHeader() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  // TODO: Ant Design Header with logo + navigation menu items
  const menuItems = [
    { key: '/', label: t('nav.home') },
    { key: '/random', label: t('nav.random') },
    { key: '/suggest', label: t('nav.suggest') },
    { key: '/map', label: t('nav.map') },
    { key: '/profile', label: t('nav.findBuddy') },
  ];

  return (
    <Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '1.2rem', cursor: 'pointer' }} onClick={() => navigate('/')}>
        Food Match
      </div>
      <Menu
        theme="dark"
        mode="horizontal"
        selectedKeys={[location.pathname]}
        items={menuItems}
        onClick={({ key }) => navigate(key)}
        style={{ flex: 1, minWidth: 0, justifyContent: 'center' }}
      />
      <LanguageSwitcher />
    </Header>
  );
}
