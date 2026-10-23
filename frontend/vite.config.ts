import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

const envRoot = resolve(__dirname, '..');

export default defineConfig(({ mode }) => {
  // Maps Embed keys appear in iframe URLs. Only this restricted public key is
  // intentionally exposed; other backend configuration stays server-side.
  const mapsEnv = loadEnv(mode, envRoot, 'GoogleMaps__');
  const mapsEmbedKey = (Object.prototype.hasOwnProperty.call(process.env, 'GoogleMaps__EmbedApiKey')
    ? process.env.GoogleMaps__EmbedApiKey
    : mapsEnv.GoogleMaps__EmbedApiKey)?.trim() || '';
  if (process.env.FOODMATCH_REQUIRE_MAPS_EMBED_KEY === '1' && !mapsEmbedKey) {
    throw new Error('GoogleMaps__EmbedApiKey is required for this release build');
  }
  return {
    plugins: [react()],
    envDir: envRoot,
    define: {
      __GOOGLE_MAPS_EMBED_API_KEY__: JSON.stringify(mapsEmbedKey),
    },
    server: {
      port: 5173,
    },
  };
});
