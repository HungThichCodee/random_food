import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const manifest = JSON.parse(readFileSync(path.join(root, 'food-images.manifest.json'), 'utf8'));
const seed = readFileSync(path.join(root, '../backend/FoodMatch/src/FoodMatch.Infrastructure/Data/Seed/DataSeeder.cs'), 'utf8');
const seedNames = [...seed.matchAll(/CreateFood\("([^"]+)"/g)].map((match) => match[1]);
const outputDir = path.join(root, 'public/food-images');
const catalogPath = path.join(root, 'src/utils/foodPhotoCatalog.json');
const creditsPath = path.join(root, '../docs/food-image-credits.md');
const headers = { 'User-Agent': 'FoodMatchImageAudit/1.0 (https://github.com/HungThichCodee/random_food)' };

function slug(value) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function plain(value = '') {
  return value.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}

async function get(url, attempts = 4) {
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      const response = await fetch(url, { headers });
      if (response.ok) return response;
      if (![429, 500, 502, 503, 504].includes(response.status)) throw new Error(`${response.status} ${url}`);
      if (attempt === attempts - 1) throw new Error(`${response.status} ${url}`);
    } catch (error) {
      if (attempt === attempts - 1) throw error;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
  }
}

async function commons(entry) {
  const url = new URL('https://commons.wikimedia.org/w/api.php');
  for (const [key, value] of Object.entries({
    action: 'query', titles: `File:${entry.commons}`, prop: 'imageinfo',
    iiprop: 'url|extmetadata', iiurlwidth: '720', format: 'json',
  })) url.searchParams.set(key, value);
  const json = await (await get(url)).json();
  const page = Object.values(json.query?.pages || {})[0];
  const info = page?.imageinfo?.[0];
  if (!info?.thumburl) throw new Error(`Commons image missing: ${entry.commons}`);
  const metadata = info.extmetadata || {};
  const license = plain(metadata.LicenseShortName?.value);
  if (!/^(CC0|CC BY(?:-SA)?(?: |$)|Public domain$)/i.test(license))
    throw new Error(`Unsupported license for ${entry.commons}: ${license}`);
  return {
    url: info.thumburl,
    source: info.descriptionurl,
    author: plain(metadata.Artist?.value) || 'Wikimedia Commons contributor',
    license,
    licenseUrl: (metadata.LicenseUrl?.value || info.descriptionurl).replace(/^http:/, 'https:'),
  };
}

async function flickr(entry) {
  const embedUrl = new URL('https://www.flickr.com/services/oembed/');
  embedUrl.searchParams.set('format', 'json');
  embedUrl.searchParams.set('url', entry.flickr);
  const embed = await (await get(embedUrl)).json();
  const page = await (await get(entry.flickr)).text();
  const licenseUrl = page.match(/https:\/\/creativecommons\.org\/licenses\/(by|by-sa)\/2\.0\//)?.[0];
  if (!embed.url || !licenseUrl) throw new Error(`Flickr image/license missing: ${entry.name}`);
  const license = licenseUrl.includes('/by-sa/') ? 'CC BY-SA 2.0' : 'CC BY 2.0';
  return { url: embed.url, source: entry.flickr, author: embed.author_name || 'Flickr contributor', license, licenseUrl };
}

function provided(entry) {
  const filename = `${slug(entry.name)}.png`;
  if (entry.provided !== filename) throw new Error(`Invalid provided filename for ${entry.name}`);
  const bytes = readFileSync(path.join(outputDir, filename));
  if (bytes.length < 1024 || bytes.length > 2_000_000 ||
    bytes.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a')
    throw new Error(`Invalid provided PNG for ${entry.name}`);
  return {
    file: filename, source: '', author: 'Chủ dự án',
    license: 'Chủ dự án cho phép sử dụng trong Food Match', licenseUrl: '',
    match: 'exact', bytes: bytes.length,
  };
}

async function download(entry) {
  if (entry.provided) return provided(entry);
  const data = entry.commons ? await commons(entry) : await flickr(entry);
  const response = await get(data.url);
  const mime = response.headers.get('content-type')?.split(';')[0].toLowerCase();
  const extension = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[mime];
  if (!extension) throw new Error(`Unexpected image type for ${entry.name}: ${mime}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length < 1024 || bytes.length > 2_000_000) throw new Error(`Unexpected image size for ${entry.name}: ${bytes.length}`);
  const filename = `${slug(entry.name)}.${extension}`;
  writeFileSync(path.join(outputDir, filename), bytes);
  return {
    file: filename, source: data.source, author: data.author, license: data.license,
    licenseUrl: data.licenseUrl, match: entry.match || 'exact',
    ...(entry.crop ? { crop: entry.crop } : {}), bytes: bytes.length,
  };
}

const manifestNames = manifest.map((entry) => entry.name);
for (const entry of manifest) {
  if (['commons', 'flickr', 'provided'].filter((key) => Boolean(entry[key])).length !== 1)
    throw new Error(`Expected one image source for ${entry.name}`);
}
const missing = seedNames.filter((name) => !manifestNames.includes(name));
const extra = manifestNames.filter((name) => !seedNames.includes(name));
if (missing.length || extra.length || new Set(manifestNames).size !== manifest.length)
  throw new Error(`Manifest coverage failed: missing=${missing.join(', ')} extra=${extra.join(', ')}`);
const onlyIndex = process.argv.indexOf('--only');
const onlyName = onlyIndex < 0 ? null : process.argv[onlyIndex + 1];
const onlyProvided = process.argv.includes('--provided');
if (onlyIndex >= 0 && (!onlyName || !manifestNames.includes(onlyName)))
  throw new Error(`Unknown dish for --only: ${onlyName || ''}`);
if (onlyName && onlyProvided) throw new Error('Use --only or --provided, not both');
if (process.argv.includes('--check')) {
  console.log(`Manifest covers all ${seedNames.length} seeded dishes.`);
  process.exit(0);
}

mkdirSync(outputDir, { recursive: true });
const catalog = onlyName || onlyProvided ? JSON.parse(readFileSync(catalogPath, 'utf8')) : {};
const failures = [];
for (const entry of manifest.filter((item) => onlyProvided ? Boolean(item.provided) : !onlyName || item.name === onlyName)) {
  try {
    catalog[entry.name] = await download(entry);
    console.log(`${entry.name} -> ${catalog[entry.name].file}`);
  } catch (error) {
    failures.push(`${entry.name}: ${error.message}`);
    console.error(failures.at(-1));
  }
}
if (failures.length) {
  console.error(`${failures.length} images failed; catalog not updated.`);
  process.exit(1);
}
if ((onlyName || onlyProvided) && (Object.keys(catalog).length !== manifest.length ||
  !manifestNames.every((name) => Object.hasOwn(catalog, name))))
  throw new Error('Existing photo catalog does not cover every seeded dish');

writeFileSync(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);
const rows = Object.entries(catalog).map(([name, item]) => {
  const author = item.author.replace(/\|/g, '\\|');
  const source = item.source || `../frontend/public/food-images/${item.file}`;
  const license = item.licenseUrl ? `[${item.license}](${item.licenseUrl})` : item.license;
  return `| ${name} | [${item.file}](${source}) | ${author} | ${license} | ${item.match === 'exact' ? 'Đúng món' : 'Minh họa biến thể'} |`;
});
writeFileSync(creditsPath, [
  '# Nguồn ảnh món ăn',
  '',
  'Ảnh trong `frontend/public/food-images` đến từ Wikimedia Commons, Flickr (được tìm qua Openverse) hoặc do chủ dự án cung cấp. Chủ dự án xác nhận sở hữu và cho phép sử dụng ảnh do mình cung cấp trong Food Match; sự cho phép này không đồng nghĩa cấp giấy phép Creative Commons. Giấy phép MIT của mã nguồn không thay thế quyền sử dụng ảnh.',
  'Ảnh ghi “Minh họa biến thể” thể hiện món hoặc nhóm món gần nhất khi chưa tìm được ảnh đúng mọi thành phần trong tên. Có thể thay bằng ảnh chính xác hơn nếu có nguồn và giấy phép phù hợp.',
  '',
  '| Món | Ảnh và trang nguồn | Tác giả / chủ sở hữu | Quyền sử dụng | Mức khớp |',
  '| --- | --- | --- | --- | --- |',
  ...rows,
  '',
].join('\n'));
console.log(`Saved ${manifest.length} images and attribution catalog.`);
