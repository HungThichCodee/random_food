import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const publicPages: Record<string, { title: string; description: string }> = {
  '/': {
    title: 'Food Match — Tìm món ăn & bạn ăn cùng',
    description: 'Food Match giúp bạn quay ngẫu nhiên món ăn, lọc theo khẩu vị, tìm quán và tìm bạn ăn cùng gần mình.',
  },
  '/random': {
    title: 'Vòng quay món ăn | Food Match',
    description: 'Quay món ăn ngẫu nhiên và lọc món mặn, món chay hoặc món ngọt trên Food Match.',
  },
  '/suggest': {
    title: 'Gợi ý món ăn | Food Match',
    description: 'Chọn khẩu vị, mức giá và buổi ăn để tìm món phù hợp trên Food Match.',
  },
  '/image-credits': {
    title: 'Nguồn ảnh món ăn | Food Match',
    description: 'Xem nguồn, chủ sở hữu và quyền sử dụng ảnh món ăn trong Food Match.',
  },
};
const canonicalOrigin = import.meta.env.VITE_PUBLIC_ORIGIN || window.location.origin;

export default function PageMetadata() {
  const { pathname } = useLocation();

  useEffect(() => {
    const page = publicPages[pathname];
    document.title = page?.title ?? 'Food Match';

    const description = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (description) description.content = page?.description ?? '';

    let robots = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    if (!robots) {
      robots = document.createElement('meta');
      robots.name = 'robots';
      document.head.append(robots);
    }
    robots.content = page ? 'index, follow' : 'noindex, nofollow';

    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (page) {
      if (!canonical) {
        canonical = document.createElement('link');
        canonical.rel = 'canonical';
        document.head.append(canonical);
      }
      canonical.href = new URL(pathname, canonicalOrigin).href;
    } else {
      canonical?.remove();
    }
  }, [pathname]);

  return null;
}
