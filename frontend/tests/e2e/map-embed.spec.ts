import { expect, test } from '@playwright/test';

test.beforeEach(async ({ context, page }) => {
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude: 10.776889, longitude: 106.700806 });
  await page.route('https://www.google.com/maps/embed/**', route =>
    route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><title>Map test</title>' }));
});

test('map offers all Embed modes and keeps the measured position', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/map');
  const frame = page.locator('main iframe');
  await expect(frame).toHaveAttribute('src', /\/embed\/v1\/view/);

  await page.getByLabel('Tên quán hoặc món ăn').fill('Cà phê');
  await page.getByRole('button', { name: 'Tìm', exact: true }).click();
  await expect(frame).toHaveAttribute('src', /\/embed\/v1\/search/);

  await page.getByRole('button', { name: 'Địa điểm' }).click();
  await expect(frame).toHaveAttribute('src', /\/embed\/v1\/place/);
  await page.getByRole('button', { name: 'Phố 360°' }).click();
  await expect(frame).toHaveAttribute('src', /\/embed\/v1\/streetview/);
  const panorama = new URL((await frame.getAttribute('src'))!);
  expect(panorama.searchParams.get('location')).toBe('10.776889,106.700806');
});

test('directions appear inside the map and change travel mode', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/map');
  await expect(page.locator('main iframe')).toHaveAttribute('src', /\/embed\/v1\/view/);
  await page.getByRole('button', { name: 'Đường đi' }).click();
  await page.getByLabel('Điểm đến').fill('Bún bò Huế');
  await page.getByRole('button', { name: 'Xem đường' }).click();
  const frame = page.locator('main iframe');
  await expect(frame).toHaveAttribute('src', /\/embed\/v1\/directions/);
  const walking = new URL((await frame.getAttribute('src'))!);
  expect(walking.searchParams.get('origin')).toBe('10.776889,106.700806');
  expect(walking.searchParams.get('destination')).toBe('Bún bò Huế');
  expect(walking.searchParams.get('mode')).toBe('walking');

  await page.getByRole('button', { name: 'Lái xe' }).click();
  const driving = new URL((await frame.getAttribute('src'))!);
  expect(driving.searchParams.get('mode')).toBe('driving');
  expect(driving.searchParams.get('origin')).toBe('10.776889,106.700806');
  const overflow = await page.evaluate(() =>
    document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});

test('a visitor without GPS can enter both route endpoints', async ({ context, page }) => {
  await context.clearPermissions();
  await page.goto('/map');
  await page.getByRole('button', { name: 'Đường đi' }).click();
  await page.getByLabel('Điểm xuất phát').fill('Chợ Bến Thành');
  await page.getByLabel('Điểm đến').fill('Dinh Độc Lập');
  await page.getByRole('button', { name: 'Xem đường' }).click();
  const frame = page.locator('main iframe');
  await expect(frame).toHaveAttribute('src', /\/embed\/v1\/directions/);
  const route = new URL((await frame.getAttribute('src'))!);
  expect(route.searchParams.get('origin')).toBe('Chợ Bến Thành');
  expect(route.searchParams.get('destination')).toBe('Dinh Độc Lập');
});
