import { expect, test } from '@playwright/test';

test('chat keeps messages visible and opens meeting map only on demand', async ({ page }) => {
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
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith('/MatchRequests/pending')) return route.fulfill({ json: [] });
    if (path.endsWith('/Chat/7/messages')) return route.fulfill({ json: [{
      id: 1, message: 'Hẹn ăn tối nhé', senderUserId: 'user-b', sentAt: new Date().toISOString(),
    }] });
    if (path.endsWith('/MatchRequests/7')) return route.fulfill({ json: {
      id: 7, status: 'Accepted', fromUserId: 'user-a', fromUserName: 'An',
      toUserId: 'user-b', toUserName: 'Bình', hasSharedLocation: true,
      buddyHasSharedLocation: true, buddyLat: 10.77, buddyLng: 106.70,
    } });
    if (path.endsWith('/MatchRequests/7/meeting-suggestions')) return route.fulfill({ json: {
      places: [], searchUrl: 'https://www.google.com/maps/search/', providerAvailable: false,
      embedUrl: 'https://maps.google.com/maps?q=qu%C3%A1n+%C4%83n&output=embed',
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
});
