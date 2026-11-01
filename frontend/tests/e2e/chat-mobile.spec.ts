import { expect, test } from '@playwright/test';

test('chat keeps messages visible and pins the exact meeting midpoint', async ({ page }) => {
  test.setTimeout(60_000);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    sessionStorage.setItem('foodmatch-user-storage', JSON.stringify({
      state: { profile: {
        id: 'user-a', token: 'test-token', displayName: 'An',
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
      } }, version: 0,
    }));
  });
  await page.route('**/hubs/**', route => route.abort());
  await page.route('https://www.google.com/maps/embed/**', route =>
    route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><title>Map test</title>' }));
  await page.route('https://maps.google.com/maps**', route =>
    route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><title>Search map test</title>' }));
  let bothSharing = true;
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith('/MatchRequests/pending')) return route.fulfill({ json: [] });
    if (path.endsWith('/Chat/7/messages')) return route.fulfill({ json: [
      { id: 1, message: 'Hẹn ăn tối nhé', senderUserId: 'user-b', sentAt: new Date().toISOString() },
      ...Array.from({ length: 18 }, (_, index) => ({
        id: index + 2, message: `Tin nhắn ${index} ${'chữrất_dài_'.repeat(16)}`,
        senderUserId: index % 2 ? 'user-a' : 'user-b', sentAt: new Date().toISOString(),
      })),
    ] });
    if (path.endsWith('/MatchRequests/7')) return route.fulfill({ json: {
      id: 7, status: 'Accepted', fromUserId: 'user-a', fromUserName: 'An',
      toUserId: 'user-b', toUserName: 'Bình có tên thật dài để kiểm tra bố cục',
      hasSharedLocation: true, buddyHasSharedLocation: bothSharing,
      buddyLat: bothSharing ? 10.77 : undefined,
      buddyLng: bothSharing ? 106.70 : undefined,
    } });
    if (path.endsWith('/MatchRequests/7/meeting-suggestions')) return route.fulfill({ json: {
      places: [], searchUrl: 'https://www.google.com/maps/search/', providerAvailable: false,
      embedUrl: 'https://maps.google.com/maps?q=qu%C3%A1n%20c%C3%A0%20ph%C3%AA&ll=10.775%2C106.705&z=15&output=embed',
      centerLat: 10.775, centerLng: 106.705,
    } });
    return route.abort();
  });
  await page.goto('/chat/7');
  await expect(page.getByText('Hẹn ăn tối nhé')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Gợi ý điểm hẹn' })).toBeVisible();
  await expect(page.locator('iframe')).toHaveCount(0);
  await expect(page.locator('#message-input')).toBeInViewport();
  await page.getByRole('button', { name: 'Mở tùy chọn trò chuyện' }).click();
  await expect(page.getByRole('button', { name: 'Báo cáo' })).toBeVisible();
  await page.getByRole('button', { name: 'Mở tùy chọn trò chuyện' }).click();
  await page.getByRole('button', { name: 'Gợi ý điểm hẹn' }).click();
  await expect(page.locator('iframe')).toHaveCount(1);
  const frame = page.locator('iframe');
  await expect(frame).toHaveAttribute('src', /\/embed\/v1\/place/);
  const pin = new URL((await frame.getAttribute('src'))!);
  expect(pin.searchParams.get('q')).toBe('10.775,106.705');
  expect(pin.searchParams.get('center')).toBe('10.775,106.705');

  await page.getByRole('button', { name: 'Cà phê' }).click();
  await expect(frame).toHaveAttribute('src', /maps\.google\.com\/maps/);
  const search = new URL((await frame.getAttribute('src'))!);
  expect(search.searchParams.get('ll')).toBe('10.775,106.705');
  expect(search.searchParams.get('z')).toBe('15');
  await page.getByRole('button', { name: 'Điểm giữa' }).click();
  await expect(frame).toHaveAttribute('src', /\/embed\/v1\/place/);

  await page.setViewportSize({ width: 320, height: 568 });
  await page.getByText('Hẹn ăn tối nhé').scrollIntoViewIfNeeded();
  const bounds = await page.evaluate(() => {
    const header = document.querySelector('header')!.getBoundingClientRect();
    const main = document.querySelector('main')!.getBoundingClientRect();
    const composer = document.querySelector('#chat-form')!.getBoundingClientRect();
    return { headerBottom: header.bottom, mainTop: main.top, mainBottom: main.bottom,
      composerTop: composer.top, composerBottom: composer.bottom,
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth };
  });
  expect(bounds.mainTop).toBeGreaterThanOrEqual(bounds.headerBottom - 1);
  expect(bounds.composerTop).toBeGreaterThanOrEqual(bounds.mainBottom - 1);
  expect(bounds.composerBottom).toBeLessThanOrEqual(568);
  expect(bounds.overflow).toBeLessThanOrEqual(1);

  await page.evaluate(() => {
    Object.defineProperty(window.visualViewport!, 'height', { configurable: true, value: 360 });
    window.visualViewport!.dispatchEvent(new Event('resize'));
  });
  await expect.poll(() => page.locator('#chat-form').evaluate(form =>
    form.getBoundingClientRect().bottom)).toBeLessThanOrEqual(360);
  await page.evaluate(() => {
    Reflect.deleteProperty(window.visualViewport!, 'height');
    window.visualViewport!.dispatchEvent(new Event('resize'));
  });
  await page.setViewportSize({ width: 568, height: 320 });
  const landscape = await page.evaluate(() => ({
    composerBottom: document.querySelector('#chat-form')!.getBoundingClientRect().bottom,
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  }));
  expect(landscape.composerBottom).toBeLessThanOrEqual(320);
  expect(landscape.overflow).toBeLessThanOrEqual(1);

  bothSharing = false;
  await page.reload();
  await expect(page.locator('iframe')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Gợi ý điểm hẹn' })).toHaveCount(0);
});
