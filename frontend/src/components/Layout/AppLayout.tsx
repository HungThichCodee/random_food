import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { TabBar } from 'antd-mobile';
import { useTranslation } from 'react-i18next';
import { 
  AppOutline, 
  UnorderedListOutline,
  EnvironmentOutline,
  UserOutline 
} from 'antd-mobile-icons';
import './AppLayout.css';

export default function AppLayout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    {
      key: '/',
      title: t('Home', 'Trang chủ'),
      icon: <AppOutline />,
    },
    {
      key: '/random',
      title: t('Random', 'Chọn món'),
      icon: <UnorderedListOutline />,
    },
    {
      key: '/map',
      title: t('Map', 'Bản đồ'),
      icon: <EnvironmentOutline />,
    },
    {
      key: '/profile',
      title: t('Profile', 'Hồ sơ'),
      icon: <UserOutline />,
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
