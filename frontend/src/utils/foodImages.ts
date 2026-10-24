const allowedImageOrigins = new Set([
  'https://images.unsplash.com',
  'https://upload.wikimedia.org',
  ...(import.meta.env.VITE_FOOD_IMAGE_ORIGINS || '').split(',')
    .map((origin: string) => origin.trim().replace(/\/$/, '')).filter(Boolean),
]);

export function safeFoodImageUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value.trim());
    return url.protocol === 'https:' && !url.username && !url.password &&
      allowedImageOrigins.has(url.origin) ? url.href : null;
  } catch {
    return null;
  }
}
