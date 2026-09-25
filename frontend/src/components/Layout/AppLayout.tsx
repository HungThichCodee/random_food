import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { TabBar } from 'antd-mobile';
import { useTranslation } from 'react-i18next';
import './AppLayout.css';

export default function AppLayout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    {
      key: '/',
      title: t('Home', 'Trang chủ'),
      icon: <span className="material-symbols-outlined">home</span>,
    },
    {
      key: '/random',
      title: t('Random', 'Chọn món'),
      icon: <span className="material-symbols-outlined">casino</span>,
    },
    {
      key: '/map',
      title: t('Map', 'Bản đồ'),
      icon: <span className="material-symbols-outlined">explore</span>,
    },
    {
      key: '/profile',
      title: t('Profile', 'Hồ sơ'),
      icon: <span className="material-symbols-outlined">person</span>,
    },
  ];

  return (
    <div className="app-layout">
      <div className="app-content">
        <Outlet />
      </div>
      <div className="app-tabbar">
        <TabBar
          activeKey={location.pathname}
          onChange={key => navigate(key)}
        >
          {tabs.map(item => (
            <TabBar.Item key={item.key} icon={item.icon} title={item.title} />
          ))}
        </TabBar>
      </div>
    </div>
  );
}
