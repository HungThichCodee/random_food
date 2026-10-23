import assert from 'node:assert/strict';
import { config } from '../vercel.mjs';

assert.equal(config.git?.deploymentEnabled, false,
  'Git pushes must not deploy before the release review');
const allHeaders = config.headers.flatMap(rule => rule.headers);
const csp = allHeaders.find(header => header.key === 'Content-Security-Policy')?.value;
assert.ok(csp, 'Content-Security-Policy header is missing');
const connect = csp.split('; ').find(directive => directive.startsWith('connect-src '));
assert.ok(connect, 'connect-src directive is missing');
assert.ok(!/\bhttps?:\s|\bwss?:\s|\*/.test(connect),
  'connect-src must use exact origins, not scheme or wildcard sources');
const images = csp.split('; ').find(directive => directive.startsWith('img-src '));
assert.ok(images, 'img-src directive is missing');
assert.ok(!/\bhttps?:\s|\*/.test(images),
  'img-src must use exact origins, not scheme or wildcard sources');
for (const origin of (process.env.VITE_FOOD_IMAGE_ORIGINS || '').split(',')
  .map(value => value.trim().replace(/\/$/, '')).filter(Boolean)) {
  assert.ok(images.split(' ').includes(origin), `img-src is missing ${origin}`);
}
assert.equal(config.rewrites?.[0]?.destination, '/index.html',
  'SPA fallback route is missing');
console.log(connect);
