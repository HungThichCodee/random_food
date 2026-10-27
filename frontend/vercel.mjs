function requiredHttpsOrigin(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required for the Vercel deployment`);

  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${name} must be an exact HTTPS origin`);
  }
  if (url.protocol !== 'https:' || !url.hostname || url.username || url.password ||
      url.pathname !== '/' || url.search || url.hash ||
      (value !== url.origin && value !== `${url.origin}/`)) {
    throw new Error(`${name} must be an exact HTTPS origin without a path or query`);
  }
  return url.origin;
}

const apiOrigin = requiredHttpsOrigin('VITE_API_URL');
const signalrOrigin = requiredHttpsOrigin('VITE_SIGNALR_URL');
const publicIndexing = process.env.FOODMATCH_SEO_INDEXABLE === '1';
if (process.env.FOODMATCH_SEO_INDEXABLE && !['0', '1'].includes(process.env.FOODMATCH_SEO_INDEXABLE))
  throw new Error('FOODMATCH_SEO_INDEXABLE must be 0 or 1');
if (publicIndexing) requiredHttpsOrigin('VITE_PUBLIC_ORIGIN');
const socketOrigin = new URL(signalrOrigin.replace(/^https:/, 'wss:')).origin;
const imageOrigins = [...new Set([
  'https://images.unsplash.com',
  'https://upload.wikimedia.org',
  ...(process.env.VITE_FOOD_IMAGE_ORIGINS || '').split(',').map(value => value.trim())
    .filter(Boolean).map(value => {
      let url;
      try {
        url = new URL(value);
      } catch {
        throw new Error('VITE_FOOD_IMAGE_ORIGINS must contain exact HTTPS origins');
      }
      if (url.protocol !== 'https:' || !url.hostname || url.username || url.password ||
          url.pathname !== '/' || url.search || url.hash ||
          (value !== url.origin && value !== `${url.origin}/`)) {
        throw new Error('VITE_FOOD_IMAGE_ORIGINS must contain exact HTTPS origins');
      }
      return url.origin;
    }),
])];
const connectSources = [...new Set([
  "'self'", 'https://challenges.cloudflare.com',
  apiOrigin, signalrOrigin, socketOrigin,
])];

export const config = {
  git: { deploymentEnabled: false },
  rewrites: [
    ...(publicIndexing ? ['/random', '/suggest', '/image-credits'].map(source => ({
      source, destination: `${source}.html`,
    })) : []),
    { source: '/(.*)', destination: '/index.html' },
  ],
  headers: [{
    source: '/(.*)',
    headers: [
      { key: 'Strict-Transport-Security', value: 'max-age=31536000' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'geolocation=(self), camera=(), microphone=()' },
      { key: 'X-Frame-Options', value: 'DENY' },
      ...(!publicIndexing ? [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] : []),
      {
        key: 'Content-Security-Policy',
        value: [
          "default-src 'self'",
          "base-uri 'self'",
          "object-src 'none'",
          "form-action 'self'",
          "frame-ancestors 'none'",
          "script-src 'self' https://challenges.cloudflare.com",
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
          "font-src 'self' data: https://fonts.gstatic.com",
          `img-src 'self' data: ${imageOrigins.join(' ')}`,
          `connect-src ${connectSources.join(' ')}`,
          'frame-src https://maps.google.com https://www.google.com https://challenges.cloudflare.com',
        ].join('; '),
      },
    ],
  }, ...['/map', '/profile', '/buddies', '/route', '/chat', '/chat/:matchId'].map(source => ({
    source,
    headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
  }))],
};
