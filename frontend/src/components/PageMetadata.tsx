import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import publicPages from '../../seo/public-pages.json';

const pages: Record<string, { title: string; description: string }> = publicPages;
const canonicalOrigin = import.meta.env.VITE_PUBLIC_ORIGIN || window.location.origin;

export default function PageMetadata() {
  const { pathname } = useLocation();

  useEffect(() => {
    const page = pages[pathname];
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
