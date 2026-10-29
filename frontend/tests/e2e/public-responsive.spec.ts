import { expect, test } from '@playwright/test';

const widths = [320, 375, 430, 768, 1024, 1440, 1920];
const routes = ['/', '/random', '/suggest', '/image-credits', '/map', '/profile'];

for (const width of widths) {
  test(`public pages fit ${width}px viewport`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });

    for (const route of routes) {
      await page.goto(route);
      await expect(page.locator('main')).toBeVisible();
      const overflow = await page.evaluate(() =>
        document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `${route} at ${width}px overflows horizontally`).toBeLessThanOrEqual(1);
    }
  });
}

test('home logo loads and primary navigation works', async ({ page }) => {
  await page.goto('/');
  const logo = page.getByAltText('Food Match Neon Heart Emblem');
  await expect(logo).toBeVisible();
  expect(await logo.evaluate((element: HTMLImageElement) => element.naturalWidth)).toBeGreaterThan(0);
  await page.locator('a[href="/random"]').first().click();
  await expect(page).toHaveURL(/\/random$/);
});

test('guest home does not load the match dialog bundle', async ({ page }) => {
  const requestedAssets: string[] = [];
  page.on('request', (request) => requestedAssets.push(request.url()));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Food Match' })).toBeVisible();
  expect(requestedAssets.some((url) => url.includes('MobileModal-'))).toBe(false);
});

test('active profile still receives a pending match dialog', async ({ page }) => {
  await page.addInitScript(() => {
    sessionStorage.setItem('foodmatch-user-storage', JSON.stringify({
      state: {
        profile: {
          id: 'test-user',
          token: 'test-token',
          expiresAt: new Date(Date.now() + 60_000).toISOString(),
        },
      },
      version: 0,
    }));
  });
  await page.route('**/hubs/**', (route) => route.abort());
  await page.route('**/api/**', (route) => {
    if (new URL(route.request().url()).pathname.endsWith('/MatchRequests/pending')) {
      return route.fulfill({ json: [{ id: 1, fromUserName: 'Bạn thử nghiệm', status: 'Pending' }] });
    }
    return route.abort();
  });
  await page.goto('/');
  await expect(page.getByText('Bạn thử nghiệm muốn rủ bạn đi ăn!')).toBeVisible();
});

test('notification button loads pending requests on demand', async ({ page }) => {
  await page.route('**/api/**', (route) => {
    if (new URL(route.request().url()).pathname.endsWith('/MatchRequests/pending')) {
      return route.fulfill({ json: [] });
    }
    return route.abort();
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Thông báo' }).click();
  await expect(page.getByText('Không có thông báo mới')).toBeVisible();
});
