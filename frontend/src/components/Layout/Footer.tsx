import { Layout } from 'antd';

const { Footer } = Layout;

export default function AppFooter() {

  return (
    <Footer style={{ textAlign: 'center' }}>
      {/* TODO: Simple footer: "Food Match © 2026" */}
      Food Match &copy; 2026
    </Footer>
  );
}
