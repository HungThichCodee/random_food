import { Layout } from 'antd';
import { useTranslation } from 'react-i18next';

const { Footer } = Layout;

export default function AppFooter() {
  const { t } = useTranslation();

  return (
    <Footer style={{ textAlign: 'center' }}>
      {/* TODO: Simple footer: "Food Match © 2026" */}
      Food Match &copy; 2026
    </Footer>
  );
}
