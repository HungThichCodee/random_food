import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const seed = readFileSync(path.join(root, '../backend/FoodMatch/src/FoodMatch.Infrastructure/Data/Seed/DataSeeder.cs'), 'utf8');
const names = [...seed.matchAll(/CreateFood\("([^"]+)"/g)].map((match) => match[1]);
const manifest = JSON.parse(readFileSync(path.join(root, 'food-images.manifest.json'), 'utf8'));
const catalog = JSON.parse(readFileSync(path.join(root, 'src/utils/foodPhotoCatalog.json'), 'utf8'));
const imageDir = path.join(root, 'public/food-images');

assert.equal(new Set(names).size, names.length, 'Seed dish names must be unique');
assert.deepEqual(manifest.map((item) => item.name), names, 'Manifest must follow and cover the seeded dishes');
assert.deepEqual(Object.keys(catalog), names, 'Photo catalog must follow and cover the seeded dishes');

const files = new Set();
for (const name of names) {
  const photo = catalog[name];
  assert.match(photo.file, /^[a-z0-9]+(?:-[a-z0-9]+)*\.(?:jpg|png|webp)$/);
  assert.ok(!files.has(photo.file), `Duplicate asset: ${photo.file}`);
  files.add(photo.file);
  const bytes = readFileSync(path.join(imageDir, photo.file));
  assert.equal(bytes.length, photo.bytes, `Image size mismatch: ${photo.file}`);
  assert.ok(bytes.length >= 1024 && bytes.length <= 2_000_000, `Image size out of range: ${photo.file}`);
  if (photo.file.endsWith('.jpg')) assert.deepEqual([...bytes.subarray(0, 3)], [0xff, 0xd8, 0xff]);
  else if (photo.file.endsWith('.png')) assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  else assert.equal(bytes.subarray(0, 4).toString(), 'RIFF');
  assert.equal(statSync(path.join(imageDir, photo.file)).isFile(), true);
  assert.ok(['exact', 'representative'].includes(photo.match));
  assert.ok(photo.author.trim());
  assert.ok(photo.license.trim());
  assert.ok(['commons.wikimedia.org', 'www.flickr.com'].includes(new URL(photo.source).host));
  assert.equal(new URL(photo.licenseUrl).protocol, 'https:');
}
assert.deepEqual(new Set(readdirSync(imageDir)), files, 'Image directory contains missing or unlisted assets');
console.log(`${names.length} seeded dishes have local image files, source links and license records.`);
