import { appendFileSync, readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';

// `vercel build` reads the variables pulled into this file, but the subsequent
// `vercel deploy --prebuilt` also evaluates vercel.mjs in the CLI process.
// Forward only its public configuration to the next Actions step.
const variables = parseEnv(readFileSync('.vercel/.env.production.local', 'utf8').replace(/^\uFEFF/, ''));
const names = [
  'VITE_API_URL',
  'VITE_SIGNALR_URL',
  'VITE_PUBLIC_ORIGIN',
  'VITE_FOOD_IMAGE_ORIGINS',
  'FOODMATCH_SEO_INDEXABLE',
];

if (!process.env.GITHUB_ENV) throw new Error('GITHUB_ENV is required');
for (const name of names) {
  const value = variables[name];
  if (name === 'VITE_API_URL' || name === 'VITE_SIGNALR_URL') {
    if (!value || value === '[SENSITIVE]')
      throw new Error(`${name} must be a readable Vercel Config value`);
  }
  if (value === undefined) continue;
  if (value.includes('\n') || value.includes('\r') || value === '[SENSITIVE]')
    throw new Error(`${name} cannot be exported to the release environment`);
  appendFileSync(process.env.GITHUB_ENV, `${name}=${value}\n`);
}
