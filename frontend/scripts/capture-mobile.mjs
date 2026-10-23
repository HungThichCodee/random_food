import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import WebSocket from 'ws';

const visualOrigin = process.env.FOODMATCH_VISUAL_ORIGIN ?? 'http://localhost:5174';

function expireVisualProfile(profileId) {
  const db = process.env.FOODMATCH_VISUAL_DB_NAME;
  const dbUser = process.env.FOODMATCH_VISUAL_DB_USER;
  assert.match(db ?? '', /^foodmatch_test_visual_[0-9a-f]{12}$/);
  assert.match(dbUser ?? '', /^[A-Za-z_][A-Za-z0-9_]*$/);
  assert.match(profileId, /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  const sql = `UPDATE "temp_users" SET "ExpiresAt" = now() - interval '1 minute' WHERE "Id" = '${profileId}'`;
  const result = spawnSync('docker', [
    'exec', 'foodmatch-postgres', 'psql', '-v', 'ON_ERROR_STOP=1',
    '-U', dbUser, '-d', db, '-c', sql,
  ], { encoding: 'utf8' });
  assert.equal(result.status, 0, 'Could not expire visual profile');
  assert.match(result.stdout, /UPDATE 1/);
}

const targets = await (await fetch('http://127.0.0.1:9222/json')).json();
const page = targets.find(target => target.type === 'page');
assert.ok(page?.webSocketDebuggerUrl, 'Edge did not expose a page target');
const socket = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.once('open', resolve);
  socket.once('error', reject);
});

let nextId = 1;
const pending = new Map();
const chatSocketIds = new Set();
const chatHandshakes = new Set();
const chatClosed = new Set();
const matchSocketIds = new Set();
const matchHandshakes = new Set();
const matchClosed = new Set();
socket.on('message', raw => {
  const message = JSON.parse(raw.toString());
  if (message.method === 'Network.webSocketCreated') {
    const path = new URL(message.params.url).pathname;
    if (path === '/hubs/chat') chatSocketIds.add(message.params.requestId);
    if (path === '/hubs/match') matchSocketIds.add(message.params.requestId);
  }
  if (message.method === 'Network.webSocketHandshakeResponseReceived' &&
    message.params.response.status === 101) {
    if (chatSocketIds.has(message.params.requestId)) chatHandshakes.add(message.params.requestId);
    if (matchSocketIds.has(message.params.requestId)) matchHandshakes.add(message.params.requestId);
  }
  if (message.method === 'Network.webSocketClosed') {
    if (chatSocketIds.has(message.params.requestId)) chatClosed.add(message.params.requestId);
    if (matchSocketIds.has(message.params.requestId)) matchClosed.add(message.params.requestId);
  }
  if (!message.id || !pending.has(message.id)) return;
  const { resolve, reject, timer } = pending.get(message.id);
  pending.delete(message.id);
  clearTimeout(timer);
  if (message.error) reject(new Error(`${message.error.code}: ${message.error.message}`));
  else resolve(message.result);
});

function send(method, params = {}) {
  const id = nextId++;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`${method} timed out`));
    }, 10000);
    pending.set(id, { resolve, reject, timer });
    socket.send(JSON.stringify({ id, method, params }));
  });
}

async function evaluate(expression) {
  const result = await send('Runtime.evaluate', { expression, returnByValue: true });
  if (result.exceptionDetails) throw new Error('Browser expression failed');
  return result.result.value;
}

async function waitFor(expression, timeoutMs = 18000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      if (await evaluate(expression)) return;
    } catch {
      // Navigation can replace the execution context between two polls.
    }
    await new Promise(resolve => setTimeout(resolve, 400));
  }
  throw new Error(`Page condition did not become ready: ${expression}`);
}

async function waitForSocket(predicate, label, timeoutMs = 50000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (predicate()) return;
    await new Promise(resolve => setTimeout(resolve, 400));
  }
  throw new Error(`Hub socket did not reach state: ${label}`);
}

async function capture(path) {
  const result = await send('Page.captureScreenshot', {
    format: 'png', captureBeyondViewport: false, fromSurface: true,
  });
  writeFileSync(path, Buffer.from(result.data, 'base64'));
}

async function api(path, method = 'GET', token, body) {
  const response = await fetch(`http://127.0.0.1:5099${path}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  assert.ok(response.ok, `${method} ${path} returned ${response.status}`);
  return response.status === 204 ? null : response.json();
}

try {
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Network.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390, height: 844, deviceScaleFactor: 1, mobile: true,
  });
  await send('Page.navigate', { url: `${visualOrigin}/random` });
  await waitFor(`document.querySelectorAll('[aria-label="Lọc món ăn"] button').length === 4 &&
    document.querySelectorAll('[aria-label="Các món trên vòng quay"] article').length > 0`);
  const metrics = await evaluate(`({width: innerWidth, scrollWidth: document.documentElement.scrollWidth,
    filters: [...document.querySelectorAll('[aria-label="Lọc món ăn"] button')].map(button => button.lastElementChild.textContent.trim())})`);
  assert.equal(metrics.width, 390);
  assert.ok(metrics.scrollWidth <= 391, `Horizontal overflow: ${metrics.scrollWidth}px`);
  assert.deepEqual(metrics.filters, ['Tất cả', 'Món mặn', 'Chay', 'Ngọt']);
  await capture(process.env.FOODMATCH_VISUAL_SCREENSHOT);

  await evaluate(`document.querySelectorAll('[aria-label="Lọc món ăn"] button')[3].click()`);
  await waitFor(`document.querySelectorAll('[aria-label="Các món trên vòng quay"] article').length > 0 &&
    document.querySelectorAll('[aria-label="Lọc món ăn"] button')[3].getAttribute('aria-pressed') === 'true'`);
  await evaluate(`document.querySelector('.random-page-spin').click()`);
  await waitFor(`Boolean(document.querySelector('[role="dialog"][aria-labelledby="random-result-title"]'))`, 10000);
  const resultMetrics = await evaluate(`({width: innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    dialogWidth: document.querySelector('[role="dialog"]').getBoundingClientRect().width,
    resultName: document.querySelector('#random-result-title')?.textContent.trim(),
    centeredName: document.querySelector('.random-page-card[aria-hidden="false"].border-primary-container h3')?.textContent.trim()})`);
  assert.equal(resultMetrics.width, 390);
  assert.ok(resultMetrics.scrollWidth <= 391, 'Result caused horizontal overflow');
  assert.ok(resultMetrics.dialogWidth <= 390, 'Result dialog exceeds mobile viewport');
  assert.equal(resultMetrics.centeredName, resultMetrics.resultName,
    'The wheel did not stop on the selected dish');
  await capture(process.env.FOODMATCH_VISUAL_RESULT_SCREENSHOT);

  const a = await api('/api/TempUsers', 'POST', undefined,
    { displayName: 'Visual A' });
  const b = await api('/api/TempUsers', 'POST', undefined,
    { displayName: 'Visual B' });
  const aLat = 10.7761234567;
  const aLng = 106.7001234567;
  const bLat = 10.7768765432;
  const bLng = 106.7008765432;
  await api(`/api/TempUsers/${a.id}/location`, 'PUT', a.token, { lat: aLat, lng: aLng });
  await api(`/api/TempUsers/${b.id}/location`, 'PUT', b.token, { lat: bLat, lng: bLng });
  await send('Browser.grantPermissions', {
    origin: visualOrigin, permissions: ['geolocation'],
  });
  await send('Emulation.setGeolocationOverride', {
    latitude: aLat, longitude: aLng, accuracy: 1,
  });
  const staleMapProfile = { ...a, currentLat: aLat - 0.002, currentLng: aLng - 0.002 };
  const mapStorage = JSON.stringify({ state: {
    profile: staleMapProfile, currentUser: null, nearbyUsers: [], isLocationEnabled: false,
  }, version: 0 });
  await evaluate(`sessionStorage.setItem('foodmatch-user-storage', ${JSON.stringify(mapStorage)})`);
  await send('Page.navigate', { url: `${visualOrigin}/buddies` });
  await waitFor(`document.body.textContent.includes('Visual B') &&
    document.body.textContent.includes('Trong 3 km')`, 12000);
  const nearbyMetrics = await evaluate(`({scrollWidth: document.documentElement.scrollWidth,
    text: document.body.textContent})`);
  assert.ok(nearbyMetrics.scrollWidth <= 391, 'Nearby list caused horizontal overflow');
  assert.ok(!nearbyMetrics.text.includes(String(bLat)) &&
    !nearbyMetrics.text.includes(String(bLng)), 'Nearby list exposed coordinates');
  await send('Page.navigate', { url: `${visualOrigin}/map?search=pho` });
  const mapCenter = `${aLat},${aLng}`;
  await waitFor(`(() => {
    const iframe = document.querySelector('iframe[title*="Google Maps"]');
    const url = iframe && new URL(iframe.src);
    return url && (url.searchParams.get('center') ?? url.searchParams.get('ll')) ===
      ${JSON.stringify(mapCenter)};
  })()`, 8000);
  if (process.env.FOODMATCH_VISUAL_EXPECT_OFFICIAL_EMBED === '1') {
    assert.equal(await evaluate(`new URL(document.querySelector('iframe[title*="Google Maps"]').src).pathname`),
      '/maps/embed/v1/search');
  }
  await evaluate(`[...document.querySelectorAll('[aria-label="Tìm nhanh trên bản đồ"] button')]
    .find(button => button.textContent === 'Món chay').click()`);
  await waitFor(`(() => {
    const iframe = document.querySelector('iframe[title*="Google Maps"]');
    return iframe && new URL(iframe.src).searchParams.get('q')?.includes('Món chay');
  })()`, 8000);
  const movedALat = aLat + 0.001234;
  const movedALng = aLng + 0.001234;
  await send('Emulation.setGeolocationOverride', {
    latitude: movedALat, longitude: movedALng, accuracy: 1,
  });
  const movedMapCenter = `${movedALat},${movedALng}`;
  await waitFor(`(() => {
    const iframe = document.querySelector('iframe[title*="Google Maps"]');
    const params = iframe && new URL(iframe.src).searchParams;
    return params && (params.get('center') ?? params.get('ll')) ===
      ${JSON.stringify(movedMapCenter)};
  })()`, 8000);
  await new Promise(resolve => setTimeout(resolve, 3000));
  await capture(process.env.FOODMATCH_VISUAL_MAP_SCREENSHOT);
  await send('Emulation.setGeolocationOverride', {
    latitude: aLat, longitude: aLng, accuracy: 1,
  });
  await send('Browser.resetPermissions');
  const match = await api('/api/MatchRequests', 'POST', a.token, { toTempUserId: b.id });
  await api(`/api/MatchRequests/${match.id}/respond`, 'PUT', b.token, { accept: true });
  await api(`/api/MatchRequests/${match.id}/share-location`, 'POST', a.token);
  const bOneSided = await api(`/api/MatchRequests/${match.id}`, 'GET', b.token);
  assert.equal(bOneSided.buddyLat, aLat);
  assert.equal(bOneSided.buddyLng, aLng);
  assert.equal(bOneSided.hasSharedLocation, false);
  assert.equal(bOneSided.buddyHasSharedLocation, true);

  await send('Page.addScriptToEvaluateOnNewDocument', { source: `(() => {
    const NativeWebSocket = window.WebSocket;
    window.__chatTestSockets = [];
    window.__matchTestSockets = [];
    window.WebSocket = class extends NativeWebSocket {
      constructor(...args) {
        super(...args);
        const path = new URL(args[0], location.href).pathname;
        if (path === '/hubs/chat') window.__chatTestSockets.push(this);
        if (path === '/hubs/match') window.__matchTestSockets.push(this);
      }
    };
  })()` });
  const bStored = JSON.stringify({ state: {
    profile: b, currentUser: null, nearbyUsers: [], isLocationEnabled: false,
  }, version: 0 });
  await evaluate(`sessionStorage.setItem('foodmatch-user-storage', ${JSON.stringify(bStored)})`);
  await send('Page.navigate', { url: `${visualOrigin}/chat/${match.id}` });
  await waitFor(`Boolean([...document.querySelectorAll('button')]
    .find(button => button.textContent.includes('Xem đường tới Visual A')))`, 25000);
  assert.equal(await evaluate(`Boolean(document.querySelector('[aria-label="Gợi ý điểm hẹn"]'))`),
    false, 'Meeting map appeared before B shared');
  assert.ok(await evaluate(`document.body.textContent.includes('Bạn chưa chia sẻ vị trí của mình với Visual A')`));
  assert.ok((await evaluate('document.documentElement.scrollWidth')) <= 391,
    'One-sided sharing caused horizontal overflow');

  await api(`/api/MatchRequests/${match.id}/share-location`, 'POST', b.token);
  await api(`/api/MatchRequests/${match.id}/meeting-place/google`, 'POST', a.token, {
    name: 'Quán hẹn thử',
    googleMapsUrl: 'https://www.google.com/maps/place/QuanHenThu',
  });
  const stored = JSON.stringify({ state: {
    profile: a, currentUser: null, nearbyUsers: [], isLocationEnabled: false,
  }, version: 0 });
  const chatBeforeProfileSwitch = new Set(chatHandshakes);
  const matchBeforeProfileSwitch = new Set(matchHandshakes);
  await evaluate(`sessionStorage.setItem('foodmatch-user-storage', ${JSON.stringify(stored)})`);
  await send('Page.reload');
  await waitFor(`Boolean(document.querySelector('iframe[title="Quán quanh điểm giữa trên Google Maps"]'))`, 25000);
  try {
    await waitForSocket(() => [...chatHandshakes].some(id => !chatBeforeProfileSwitch.has(id)) &&
      [...matchHandshakes].some(id => !matchBeforeProfileSwitch.has(id)),
    'A chat and match handshakes after profile switch', 25000);
  } catch (error) {
    console.error('Hub handshake counts after profile switch:', {
      chatCreated: chatSocketIds.size, chatAccepted: chatHandshakes.size,
      matchCreated: matchSocketIds.size, matchAccepted: matchHandshakes.size,
      chatClosed: chatClosed.size, matchClosed: matchClosed.size,
    });
    throw error;
  }
  const meeting = await evaluate(`(() => {
    const section = document.querySelector('[aria-label="Gợi ý điểm hẹn"]');
    const iframe = section?.querySelector('iframe');
    const url = iframe ? new URL(iframe.src) : null;
    const openLink = [...(section?.querySelectorAll('a') ?? [])]
      .find(link => link.textContent.includes('Mở Google Maps'));
    const searchUrl = openLink ? new URL(openLink.href) : null;
    const officialEmbed = url?.pathname === '/maps/embed/v1/search';
    const coordinates = (officialEmbed ? url?.searchParams.get('center') : url?.searchParams.get('q'))
      ?.match(/(-?\\d+\\.\\d+),(-?\\d+\\.\\d+)/);
    const searchCoordinates = searchUrl?.searchParams.get('query')?.match(/(-?\\d+\\.\\d+),(-?\\d+\\.\\d+)/);
    return { width: innerWidth, scrollWidth: document.documentElement.scrollWidth,
      sectionWidth: section?.getBoundingClientRect().width,
      iframeWidth: iframe?.getBoundingClientRect().width,
      iframeHost: url?.host, officialEmbed, coordinates: coordinates?.slice(1).map(Number),
      mapCenter: (url?.searchParams.get('center') ?? url?.searchParams.get('ll'))?.split(',').map(Number),
      mapZoom: url?.searchParams.get('zoom') ?? url?.searchParams.get('z'),
      searchHost: searchUrl?.host,
      searchCoordinates: searchCoordinates?.slice(1).map(Number),
      hasProposal: Boolean(document.querySelector('[aria-label="Địa điểm hẹn đã đề xuất"]')),
      hasLinkInput: Boolean(document.querySelector('#google-place-url')) };
  })()`);
  assert.equal(meeting.width, 390);
  assert.ok(meeting.scrollWidth <= 391, 'Chat page has horizontal overflow');
  assert.ok(meeting.sectionWidth <= 390 && meeting.iframeWidth <= 390,
    'Meeting area exceeds mobile viewport');
  assert.ok(meeting.iframeHost === 'www.google.com' || meeting.iframeHost === 'maps.google.com');
  if (process.env.FOODMATCH_VISUAL_EXPECT_OFFICIAL_EMBED === '1') {
    assert.equal(meeting.officialEmbed, true, 'Configured Maps Embed API did not produce the official iframe');
  }
  assert.equal(meeting.searchHost, 'www.google.com');
  assert.ok(meeting.hasProposal && meeting.hasLinkInput);
  assert.ok(Math.abs(meeting.coordinates[0] - (aLat + bLat) / 2) < 1e-10);
  assert.ok(Math.abs(meeting.coordinates[1] - (aLng + bLng) / 2) < 1e-10);
  assert.ok(Math.abs(meeting.mapCenter[0] - (aLat + bLat) / 2) < 1e-10);
  assert.ok(Math.abs(meeting.mapCenter[1] - (aLng + bLng) / 2) < 1e-10);
  assert.ok(Math.abs(meeting.searchCoordinates[0] - (aLat + bLat) / 2) < 1e-10);
  assert.ok(Math.abs(meeting.searchCoordinates[1] - (aLng + bLng) / 2) < 1e-10);
  assert.equal(meeting.mapZoom, '15');
  await evaluate(`[...document.querySelectorAll('[aria-label="Loại địa điểm hẹn"] button')]
    .find(button => button.textContent === 'Cà phê').click()`);
  await waitFor(`(() => {
    const iframe = document.querySelector('[aria-label="Gợi ý điểm hẹn"] iframe');
    const params = iframe && new URL(iframe.src).searchParams;
    return params?.get('q')?.includes('quán cà phê') &&
      (params.get('center') ?? params.get('ll')) === ${JSON.stringify(`${(aLat + bLat) / 2},${(aLng + bLng) / 2}`)};
  })()`, 10000);
  await evaluate(`(() => {
    const section = document.querySelector('[aria-label="Gợi ý điểm hẹn"]');
    scrollTo(0, section.getBoundingClientRect().top + scrollY - 95);
  })()`);
  await new Promise(resolve => setTimeout(resolve, 4000));
  await capture(process.env.FOODMATCH_VISUAL_MEETING_SCREENSHOT);

  const movedBLat = bLat + 0.001;
  const movedBLng = bLng + 0.001;
  await api(`/api/TempUsers/${b.id}/location`, 'PUT', b.token,
    { lat: movedBLat, lng: movedBLng });
  const movedCenter = `${(aLat + movedBLat) / 2},${(aLng + movedBLng) / 2}`;
  await waitFor(`(() => {
    const iframe = document.querySelector('[aria-label="Gợi ý điểm hẹn"] iframe');
    const params = iframe && new URL(iframe.src).searchParams;
    return params && (params.get('center') ?? params.get('ll')) === ${JSON.stringify(movedCenter)};
  })()`, 60000);
  const updatedCenter = await evaluate(`(() => {
    const params = new URL(document.querySelector('[aria-label="Gợi ý điểm hẹn"] iframe').src).searchParams;
    return params.get('center') ?? params.get('ll');
  })()`);
  assert.equal(updatedCenter, movedCenter, 'Map center did not follow the exact updated GPS');

  await api(`/api/MatchRequests/${match.id}/stop-sharing-location`, 'POST', a.token);
  await waitFor(`!document.querySelector('[aria-label="Gợi ý điểm hẹn"]') &&
    !document.querySelector('[aria-label="Địa điểm hẹn đã đề xuất"]')`, 25000);

  await waitForSocket(() => chatHandshakes.size > 0 && matchHandshakes.size > 0,
    'initial chat and match handshakes');
  const connectedBeforeOutage = new Set(chatHandshakes);
  const matchConnectedBeforeOutage = new Set(matchHandshakes);
  const activeChatSocketId = [...chatHandshakes].at(-1);
  const activeMatchSocketId = [...matchHandshakes].at(-1);
  await send('Network.emulateNetworkConditions', {
    offline: true, latency: 0, downloadThroughput: 0, uploadThroughput: 0,
  });
  assert.equal(await evaluate('navigator.onLine'), false,
    'Browser did not enter offline state');
  await evaluate(`[...window.__chatTestSockets, ...window.__matchTestSockets]
    .filter(socket => socket.readyState === 1)
    .forEach(socket => socket.close())`);
  await waitForSocket(() => chatClosed.has(activeChatSocketId) &&
    matchClosed.has(activeMatchSocketId),
  'chat and match disconnect while offline', 10000);
  const missedMessage = `offline-chat-${Date.now()}`;
  await api('/api/Chat', 'POST', b.token,
    { matchRequestId: match.id, message: missedMessage });
  assert.equal(await evaluate(`document.querySelector('#chat-stream')?.textContent.includes(${JSON.stringify(missedMessage)})`),
    false, 'Offline tab received a live chat message');
  const c = await api('/api/TempUsers', 'POST', undefined,
    { displayName: 'Visual C' });
  await api(`/api/TempUsers/${c.id}/location`, 'PUT', c.token,
    { lat: aLat + 0.0005, lng: aLng + 0.0005 });
  const missedInvitation = await api('/api/MatchRequests', 'POST', c.token,
    { toTempUserId: a.id });
  const pendingInvitations = await api('/api/MatchRequests/pending', 'GET', a.token);
  assert.ok(pendingInvitations.some(invitation => invitation.id === missedInvitation.id),
    'Missed invitation was not persisted for A');
  assert.equal(await evaluate(`Boolean([...document.querySelectorAll('.adm-modal')]
    .find(modal => getComputedStyle(modal).display !== 'none' &&
      modal.textContent.includes('Visual C')))`), false,
  'Offline tab received a live match invitation');

  await send('Network.emulateNetworkConditions', {
    offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1,
  });
  await waitForSocket(() => [...chatHandshakes].some(id => !connectedBeforeOutage.has(id)),
    'chat reconnect after network recovery', 35000);
  await waitForSocket(() => [...matchHandshakes].some(id => !matchConnectedBeforeOutage.has(id)),
    'match reconnect after network recovery', 35000);
  await waitFor(`document.querySelector('#chat-stream')?.textContent.includes(${JSON.stringify(missedMessage)})`,
    25000);
  await waitFor(`Boolean([...document.querySelectorAll('.adm-modal')]
    .find(modal => getComputedStyle(modal).display !== 'none' &&
      modal.textContent.includes('Visual C')))`, 25000);
  const liveMessage = `live-chat-${Date.now()}`;
  await api('/api/Chat', 'POST', b.token,
    { matchRequestId: match.id, message: liveMessage });
  await waitFor(`document.querySelector('#chat-stream')?.textContent.includes(${JSON.stringify(liveMessage)})`,
    15000);

  expireVisualProfile(c.id);
  await waitFor(`!Boolean([...document.querySelectorAll('.adm-modal')]
    .find(modal => getComputedStyle(modal).display !== 'none' &&
      modal.textContent.includes('Visual C')))`, 15000);
  const afterSenderExpired = await api('/api/MatchRequests/pending', 'GET', a.token);
  assert.ok(!afterSenderExpired.some(invitation => invitation.id === missedInvitation.id),
    'Expired sender invitation remained pending');

  const expiringProfile = { ...a, expiresAt: new Date(Date.now() + 12000).toISOString() };
  const expiringStorage = JSON.stringify({ state: {
    profile: expiringProfile, currentUser: null, nearbyUsers: [], isLocationEnabled: false,
  }, version: 0 });
  await evaluate(`sessionStorage.setItem('foodmatch-user-storage', ${JSON.stringify(expiringStorage)})`);
  await send('Page.reload');
  await waitFor(`location.pathname === '/chat/${match.id}' &&
    Boolean(document.querySelector('#chat-stream'))`, 8000);
  await waitFor(`location.pathname === '/profile'`, 18000);
  assert.equal(await evaluate(`Boolean(document.querySelector('#chat-stream'))`), false,
    'Expired profile still shows private chat');
  assert.equal(await evaluate(`Boolean(document.querySelector('iframe[title^="Đường tới"]'))`), false,
    'Expired profile still shows a private route');
  assert.equal(await evaluate(`Boolean([...document.querySelectorAll('.adm-modal')]
    .find(modal => getComputedStyle(modal).display !== 'none' &&
      modal.textContent.includes('Visual C')))`), false,
  'Expired profile still shows a private match invitation');

  const routeProfile = {
    ...a, currentLat: aLat - 0.002, currentLng: aLng - 0.002,
    expiresAt: new Date(Date.now() + 25000).toISOString(),
  };
  const routeStorage = JSON.stringify({ state: {
    profile: routeProfile, currentUser: null, nearbyUsers: [], isLocationEnabled: false,
  }, version: 0 });
  await send('Browser.grantPermissions', {
    origin: visualOrigin, permissions: ['geolocation'],
  });
  await send('Emulation.setGeolocationOverride', {
    latitude: aLat, longitude: aLng, accuracy: 1,
  });
  await evaluate(`sessionStorage.setItem('foodmatch-user-storage', ${JSON.stringify(routeStorage)})`);
  await send('Page.navigate', { url: `${visualOrigin}/chat/${match.id}` });
  await waitFor(`Boolean([...document.querySelectorAll('button')]
    .find(button => button.textContent.includes('Xem đường tới Visual B')))`, 8000);
  await evaluate(`[...document.querySelectorAll('button')]
    .find(button => button.textContent.includes('Xem đường tới Visual B')).click()`);
  await waitFor(`location.pathname === '/route' &&
    Boolean(document.querySelector('iframe[title^="Đường tới"]'))`, 8000);
  const routeOrigin = `${aLat},${aLng}`;
  await waitFor(`(() => {
    const iframe = document.querySelector('iframe[title^="Đường tới"]');
    const params = iframe && new URL(iframe.src).searchParams;
    return params && (params.get('origin') ?? params.get('saddr')) ===
      ${JSON.stringify(routeOrigin)};
  })()`, 8000);
  if (process.env.FOODMATCH_VISUAL_EXPECT_OFFICIAL_EMBED === '1') {
    const routeUrl = await evaluate(`(() => {
      const url = new URL(document.querySelector('iframe[title^="Đường tới"]').src);
      return { pathname: url.pathname, destination: url.searchParams.get('destination') };
    })()`);
    assert.equal(routeUrl.pathname, '/maps/embed/v1/directions');
    assert.equal(routeUrl.destination, `${movedBLat},${movedBLng}`);
    await evaluate(`[...document.querySelectorAll('[aria-label="Phương tiện di chuyển"] button')]
      .find(button => button.textContent === 'Lái xe').click()`);
    await waitFor(`new URL(document.querySelector('iframe[title^="Đường tới"]').src)
      .searchParams.get('mode') === 'driving'`, 8000);
  }
  await send('Emulation.setGeolocationOverride', {
    latitude: movedALat, longitude: movedALng, accuracy: 1,
  });
  const movedRouteOrigin = `${movedALat},${movedALng}`;
  await waitFor(`(() => {
    const iframe = document.querySelector('iframe[title^="Đường tới"]');
    const params = iframe && new URL(iframe.src).searchParams;
    return params && (params.get('origin') ?? params.get('saddr')) ===
      ${JSON.stringify(movedRouteOrigin)};
  })()`, 8000);
  await new Promise(resolve => setTimeout(resolve, 3000));
  await capture(process.env.FOODMATCH_VISUAL_ROUTE_SCREENSHOT);
  await waitFor(`location.pathname === '/profile'`, 30000);
  assert.equal(await evaluate(`Boolean(document.querySelector('iframe[title^="Đường tới"]'))`), false,
    'Expired profile still shows the matched person on a route');

  await api(`/api/MatchRequests/${match.id}/share-location`, 'POST', a.token);
  await evaluate(`sessionStorage.setItem('foodmatch-user-storage', ${JSON.stringify(bStored)})`);
  await send('Page.navigate', { url: `${visualOrigin}/chat/${match.id}` });
  await waitFor(`location.pathname === '/chat/${match.id}' &&
    Boolean(document.querySelector('#chat-stream')) &&
    Boolean(document.querySelector('iframe[title="Quán quanh điểm giữa trên Google Maps"]'))`, 8000);
  expireVisualProfile(a.id);
  await waitFor(`location.pathname === '/buddies' &&
    !document.querySelector('#chat-stream')`, 18000);
  assert.equal(await evaluate(`Boolean(document.querySelector('#chat-stream'))`), false,
    'Chat remained visible to B after A expired on the server');
  assert.equal(await evaluate(`Boolean(document.querySelector('iframe[title="Quán quanh điểm giữa trên Google Maps"]'))`), false,
    'Private meeting map remained visible to B after A expired on the server');
  await send('Browser.setPermission', {
    origin: visualOrigin, permission: { name: 'geolocation' }, setting: 'denied',
  });
  await evaluate(`sessionStorage.setItem('foodmatch-user-storage', ${JSON.stringify(mapStorage)})`);
  await send('Page.navigate', { url: `${visualOrigin}/map?search=pho` });
  const savedMapCenter = `${staleMapProfile.currentLat},${staleMapProfile.currentLng}`;
  await waitFor(`(() => {
    const iframe = document.querySelector('iframe[title*="Google Maps"]');
    const status = document.querySelector('[role="status"]');
    const params = iframe && new URL(iframe.src).searchParams;
    return params && (params.get('center') ?? params.get('ll')) ===
      ${JSON.stringify(savedMapCenter)} && status?.textContent.includes('GPS chưa khả dụng');
  })()`, 8000);
  assert.ok((await evaluate('document.documentElement.scrollWidth')) <= 391,
    'Saved GPS warning caused horizontal overflow');
  console.log('Edge mobile checks passed: 390px wheel/result, nearby 3 km label without coordinates, live exact map and route origin, exact moving midpoint, consent revocation, missed chat and invitation after reconnect, expired sender popup removal, live chat, own session expiry clears chat and private route, expired partner redirects chat, no horizontal overflow.');
} finally {
  socket.close();
}
