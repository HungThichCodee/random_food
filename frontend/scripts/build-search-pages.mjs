import { readFile, readdir, writeFile } from 'node:fs/promises';

const dist = new URL('../dist/', import.meta.url);
const pages = JSON.parse(await readFile(new URL('../seo/public-pages.json', import.meta.url), 'utf8'));
const template = (await readFile(new URL('index.html', dist), 'utf8'))
  .replace(/^[ \t]*<link rel="canonical" href="[^"]*" \/>\r?\n/gm, '')
  .replace(/^[ \t]*<script type="application\/ld\+json">[^\n]*<\/script>\r?\n/gm, '')
  .replace(/^[ \t]*<meta name="google-site-verification" content="[^"]*" \/>\r?\n/gm, '');
const indexable = process.env.FOODMATCH_SEO_INDEXABLE === '1';

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]);
}

function addToHead(html, tag) {
  return html.replace('  </head>', `    ${tag}\n  </head>`);
}

function publicOrigin() {
  const value = process.env.VITE_PUBLIC_ORIGIN;
  if (!value) throw new Error('VITE_PUBLIC_ORIGIN is required when indexing is enabled');
  const url = new URL(value);
  if (url.protocol !== 'https:' || (value !== url.origin && value !== `${url.origin}/`)) {
    throw new Error('VITE_PUBLIC_ORIGIN must be an exact HTTPS origin');
  }
  return url.origin;
}

if (indexable) {
  const origin = publicOrigin();
  const logoAsset = (await readdir(new URL('assets/', dist)))
    .find(file => /^logo-256-[A-Za-z0-9_-]+\.webp$/.test(file));
  if (!logoAsset) throw new Error('The optimized home logo is missing from the build');
  if (!template.includes('  </head>') || !/<title>[^<]*<\/title>/.test(template) ||
      !/<meta name="description" content="[^"]*"\s*\/>/.test(template)) {
    throw new Error('The built HTML template is missing required metadata');
  }

  for (const [path, page] of Object.entries(pages)) {
    let html = template
      .replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(page.title)}</title>`)
      .replace(/<meta name="description" content="[^"]*"\s*\/>/,
        `<meta name="description" content="${escapeHtml(page.description)}" />`);
    const canonical = `${origin}${path}`;
    html = addToHead(html, `<link rel="canonical" href="${escapeHtml(canonical)}" />`);
    if (path === '/') {
      html = addToHead(html,
        `<link rel="preload" as="image" href="/assets/${logoAsset}" fetchpriority="high" />`);
      const website = {
        '@context': 'https://schema.org', '@type': 'WebSite',
        name: 'Food Match', alternateName: 'FoodMatchh', url: `${origin}/`,
      };
      html = addToHead(html,
        `<script type="application/ld+json">${JSON.stringify(website)}</script>`);
      const verification = process.env.FOODMATCH_GOOGLE_SITE_VERIFICATION?.trim();
      if (verification) {
        html = addToHead(html,
          `<meta name="google-site-verification" content="${escapeHtml(verification)}" />`);
      }
    }
    const file = path === '/' ? 'index.html' : `${path.slice(1)}.html`;
    await writeFile(new URL(file, dist), html);
  }

  const locations = Object.keys(pages).map(path =>
    `  <url><loc>${escapeHtml(`${origin}${path}`)}</loc></url>`).join('\n');
  await writeFile(new URL('sitemap.xml', dist),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${locations}\n</urlset>\n`);
  await writeFile(new URL('robots.txt', dist),
    `User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`);
} else {
  // Staging remains crawlable so its X-Robots-Tag: noindex can be seen.
  await writeFile(new URL('robots.txt', dist), 'User-agent: *\nAllow: /\n');
}
