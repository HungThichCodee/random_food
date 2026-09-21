import { Layout } from 'antd';
import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AppHeader from './Header';
import AppFooter from './Footer';

const { Content } = Layout;

export default function AppLayout() {
  const { t } = useTranslation();

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* TODO: Shell with Ant Design Layout, Header with nav menu + LanguageSwitcher, Content, Footer */}
      <AppHeader />
      <Content style={{ padding: '0 24px', minHeight: 'calc(100vh - 134px)' }}>
        <Outlet />
      </Content>
      <AppFooter />
    </Layout>
  );
}
