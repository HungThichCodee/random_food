import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { HubConnectionBuilder, HttpTransportType, LogLevel } from '@microsoft/signalr';
import WebSocket from 'ws';

const base = process.env.FOODMATCH_SMOKE_URL ?? 'http://localhost:5099';
const latA = 10.7761234567;
const lngA = 106.7001234567;
const latB = 10.7768765432;
const lngB = 106.7008765432;
const connections = [];

async function request(path, method = 'GET', token, body) {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const value = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) throw new Error(`${method} ${path}: ${response.status} ${JSON.stringify(value)}`);
  return value;
}

async function expectStatus(path, method, token, status, body) {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  assert.equal(response.status, status, `${method} ${path}`);
  return response;
}

async function user(name, lat, lng) {
  const profile = await request('/api/TempUsers', 'POST', undefined, { displayName: name });
  await request(`/api/TempUsers/${profile.id}/location`, 'PUT', profile.token, { lat, lng });
  await request(`/api/TempUsers/${profile.id}/visibility`, 'PUT', profile.token, true);
  return profile;
}

async function hub(path, token) {
  const connection = new HubConnectionBuilder()
    .withUrl(`${base}${path}`, {
      accessTokenFactory: () => token,
      transport: HttpTransportType.WebSockets,
      skipNegotiation: true,
    })
    .configureLogging(LogLevel.None)
    .build();
  await connection.start();
  connections.push(connection);
  return connection;
}

function nextEvent(connection, name, timeoutMs = 4000) {
  let resolveEvent;
  let rejectEvent;
  const event = new Promise((resolve, reject) => {
    resolveEvent = resolve;
    rejectEvent = reject;
  });
  const onEvent = value => {
    clearTimeout(timer);
    connection.off(name, onEvent);
    resolveEvent(value);
  };
  const timer = setTimeout(() => {
    connection.off(name, onEvent);
    rejectEvent(new Error(`${name} did not arrive`));
  }, timeoutMs);
  connection.on(name, onEvent);
  return event;
}

function shortToken(profileId) {
  const secret = process.env.FOODMATCH_SMOKE_JWT_SECRET;
  const issuer = process.env.FOODMATCH_SMOKE_JWT_ISSUER;
  const audience = process.env.FOODMATCH_SMOKE_JWT_AUDIENCE;
  if (!secret || !issuer || !audience) return null;
  const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const head = encode({ alg: 'HS256', typ: 'JWT' });
  const body = encode({
    'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier': profileId,
    iss: issuer,
    aud: audience,
    nbf: now - 1,
    exp: now + 3,
  });
  const signature = createHmac('sha256', secret).update(`${head}.${body}`).digest('base64url');
  return `${head}.${body}.${signature}`;
}

function expireConsent(matchId, side = 'both') {
  const db = process.env.FOODMATCH_SMOKE_DB_NAME;
  const dbUser = process.env.FOODMATCH_SMOKE_DB_USER;
  assert.match(db ?? '', /^foodmatch_test_signalr_[0-9a-f]{12}$/);
  assert.match(dbUser ?? '', /^[A-Za-z_][A-Za-z0-9_]*$/);
  assert.ok(Number.isSafeInteger(matchId) && matchId > 0);
  assert.ok(side === 'from' || side === 'both');
  const columns = side === 'from'
    ? '"FromUserSharedAt"'
    : '"FromUserSharedAt", "ToUserSharedAt"';
  const assignments = columns.split(', ').map(column =>
    `${column} = now() - interval '61 minutes'`).join(', ');
  const sql = `UPDATE "match_requests" SET ${assignments}, "LocationSharedAt" = now() - interval '61 minutes' WHERE "Id" = ${matchId}`;
  const result = spawnSync('docker', [
    'exec', 'foodmatch-postgres', 'psql', '-v', 'ON_ERROR_STOP=1',
    '-U', dbUser, '-d', db, '-c', sql,
  ], { encoding: 'utf8' });
  assert.equal(result.status, 0, 'Could not expire consent in temporary database');
  assert.match(result.stdout, /UPDATE 1/);
}

function expireProfile(profileId) {
  const db = process.env.FOODMATCH_SMOKE_DB_NAME;
  const dbUser = process.env.FOODMATCH_SMOKE_DB_USER;
  assert.match(db ?? '', /^foodmatch_test_signalr_[0-9a-f]{12}$/);
  assert.match(dbUser ?? '', /^[A-Za-z_][A-Za-z0-9_]*$/);
  assert.match(profileId, /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  const sql = `UPDATE "temp_users" SET "ExpiresAt" = now() - interval '1 minute' WHERE "Id" = '${profileId}'`;
  const result = spawnSync('docker', [
    'exec', 'foodmatch-postgres', 'psql', '-v', 'ON_ERROR_STOP=1',
    '-U', dbUser, '-d', db, '-c', sql,
  ], { encoding: 'utf8' });
  assert.equal(result.status, 0, 'Could not expire profile in temporary database');
  assert.match(result.stdout, /UPDATE 1/);
}

function assertNoSessionSecrets(value) {
  if (Array.isArray(value)) {
    value.forEach(assertNoSessionSecrets);
  } else if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      assert.ok(!['token', 'sessiontoken', 'jwtsecret'].includes(key.toLowerCase()),
        `Unexpected secret field in response: ${key}`);
      assertNoSessionSecrets(child);
    }
  }
}

async function checkBrowserOriginPolicy() {
  const allowedOrigin = process.env.FOODMATCH_SMOKE_ALLOWED_ORIGIN;
  assert.ok(allowedOrigin);
  const preflight = origin => fetch(`${base}/api/TempUsers`, {
    method: 'OPTIONS',
    headers: {
      Origin: origin,
      'Access-Control-Request-Method': 'POST',
    },
  });
  const allowed = await preflight(allowedOrigin);
  assert.equal(allowed.headers.get('access-control-allow-origin'), allowedOrigin);
  const denied = await preflight('https://outside.example');
  assert.equal(denied.headers.get('access-control-allow-origin'), null);

  await new Promise((resolve, reject) => {
    const socket = new WebSocket(`${base.replace(/^http/, 'ws')}/hubs/match`, {
      origin: 'https://outside.example',
    });
    const timer = setTimeout(() => {
      socket.terminate();
      reject(new Error('WebSocket origin check timed out'));
    }, 4000);
    socket.once('unexpected-response', (_request, response) => {
      clearTimeout(timer);
      response.resume();
      response.socket.destroy();
      try { assert.equal(response.statusCode, 403); resolve(); } catch (error) { reject(error); }
    });
    socket.once('open', () => {
      clearTimeout(timer);
      socket.terminate();
      reject(new Error('WebSocket accepted an unapproved Origin'));
    });
    socket.once('error', error => { clearTimeout(timer); reject(error); });
  });
}

try {
  await checkBrowserOriginPolicy();
  const [a, b, c] = await Promise.all([
    user('Signal A', latA, lngA),
    user('Signal B', latB, lngB),
    user('Signal C', 10.7772, 106.7012),
  ]);
  const far = await user('Signal Far', 10.9, 106.7);
  await expectStatus('/api/MatchRequests', 'POST', a.token, 400,
    { toTempUserId: far.id });
  await request(`/api/TempUsers/${a.id}/visibility`, 'PUT', a.token, false);
  await request(`/api/TempUsers/${a.id}/location`, 'PUT', a.token,
    { lat: latA, lng: lngA });
  const hiddenNearby = await request('/api/TempUsers/nearby', 'GET', c.token);
  assert.ok(!hiddenNearby.some(profile => profile.id === a.id),
    'GPS refresh must not undo an explicit nearby visibility choice');
  await request(`/api/TempUsers/${a.id}/visibility`, 'PUT', a.token, true);
  const visibleNearby = await request('/api/TempUsers/nearby', 'GET', c.token);
  assert.ok(visibleNearby.some(profile => profile.id === a.id));
  const pending = await request('/api/MatchRequests', 'POST', a.token, { toTempUserId: b.id });
  const cPending = await request('/api/MatchRequests/pending', 'GET', c.token);
  assert.equal(cPending.length, 0);
  await expectStatus(`/api/TempUsers/${a.id}/location`, 'PUT', c.token, 403,
    { lat: latB, lng: lngB });
  await expectStatus(`/api/TempUsers/${a.id}/visibility`, 'PUT', c.token, 403, false);
  await expectStatus(`/api/MatchRequests/${pending.id}/respond`, 'PUT', a.token, 403,
    { accept: true });
  const pendingView = await request(`/api/MatchRequests/${pending.id}`, 'GET', b.token);
  assert.equal(pendingView.buddyLat, null);
  const pendingShare = await fetch(`${base}/api/MatchRequests/${pending.id}/share-location`, {
    method: 'POST', headers: { Authorization: `Bearer ${a.token}` },
  });
  assert.equal(pendingShare.status, 403);
  const missingDecision = await fetch(`${base}/api/MatchRequests/${pending.id}/respond`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${b.token}`, 'Content-Type': 'application/json' },
    body: '{}',
  });
  assert.equal(missingDecision.status, 400);
  const stillPending = await request(`/api/MatchRequests/${pending.id}`, 'GET', b.token);
  assert.equal(stillPending.status, 'Pending');
  const accepted = await request(`/api/MatchRequests/${pending.id}/respond`, 'PUT', b.token, { accept: true });
  assert.equal(accepted.status, 'Accepted');
  await expectStatus('/api/MatchRequests/active', 'GET', c.token, 404);

  const [hubA, hubB, hubC, chatA, chatB, chatC] = await Promise.all([
    hub('/hubs/match', a.token),
    hub('/hubs/match', b.token),
    hub('/hubs/match', c.token),
    hub('/hubs/chat', a.token),
    hub('/hubs/chat', b.token),
    hub('/hubs/chat', c.token),
  ]);
  await chatA.invoke('JoinChatGroup', String(pending.id));
  await chatB.invoke('JoinChatGroup', String(pending.id));
  await assert.rejects(chatC.invoke('JoinChatGroup', String(pending.id)));
  const outsider = await fetch(`${base}/api/MatchRequests/${pending.id}`, {
    headers: { Authorization: `Bearer ${c.token}` },
  });
  assert.equal(outsider.status, 403);
  await expectStatus(`/api/MatchRequests/${pending.id}`, 'GET', undefined, 401);
  await expectStatus(`/api/MatchRequests/${pending.id}/share-location`, 'POST', c.token, 403);
  await expectStatus(`/api/MatchRequests/${pending.id}/stop-sharing-location`, 'POST', c.token, 403);
  await expectStatus(`/api/MatchRequests/${pending.id}/meeting-suggestions`, 'GET', c.token, 403);
  await expectStatus(`/api/MatchRequests/${pending.id}/meeting-place/google`, 'POST', c.token, 403,
    { name: 'Quan thu', googleMapsUrl: 'https://www.google.com/maps/place/QuanThu' });
  await expectStatus(`/api/MatchRequests/${pending.id}/meeting-place`, 'POST', c.token, 403,
    { placeId: 'node/1' });
  await expectStatus(`/api/MatchRequests/${pending.id}/meeting-place/confirm`, 'POST', c.token, 403,
    { placeId: 'node/1' });
  await expectStatus(`/api/Chat/${pending.id}/messages`, 'GET', c.token, 403);
  await expectStatus('/api/Chat', 'POST', c.token, 403,
    { matchRequestId: pending.id, message: 'test outsider' });
  await expectStatus('/api/Reports', 'POST', c.token, 403,
    { reportedTempUserId: a.id, reason: 'test outsider' });
  const nearby = await request('/api/TempUsers/nearby', 'GET', c.token);
  assert.ok(nearby.length > 0);
  const tinyRadius = await request('/api/TempUsers/nearby?radiusKm=0.001', 'GET', c.token);
  const hugeRadius = await request('/api/TempUsers/nearby?radiusKm=50', 'GET', c.token);
  assert.deepEqual(tinyRadius.map(user => user.id).sort(), nearby.map(user => user.id).sort());
  assert.deepEqual(hugeRadius.map(user => user.id).sort(), nearby.map(user => user.id).sort());
  for (const candidate of nearby) {
    assert.equal(candidate.distanceLabel, 'Trong 3 km');
    assert.equal(candidate.currentLat, undefined);
    assert.equal(candidate.currentLng, undefined);
    assert.equal(candidate.lat, undefined);
    assert.equal(candidate.lng, undefined);
  }
  assertNoSessionSecrets(nearby);

  let outsiderNotifications = 0;
  let outsiderMessages = 0;
  hubC.on('LocationSharingUpdated', () => outsiderNotifications++);
  chatC.on('ReceiveMessage', () => outsiderMessages++);
  const chatEvent = nextEvent(chatB, 'ReceiveMessage');
  const savedMessage = await request('/api/Chat', 'POST', a.token,
    { matchRequestId: pending.id, message: 'Hen o quan thu' });
  const deliveredMessage = await chatEvent;
  assert.equal(deliveredMessage.id, savedMessage.id);
  assert.equal(deliveredMessage.message, 'Hen o quan thu');
  const history = await request(`/api/Chat/${pending.id}/messages`, 'GET', b.token);
  assert.ok(history.some(message => message.id === savedMessage.id));
  assertNoSessionSecrets([savedMessage, deliveredMessage, history]);
  assert.equal(outsiderMessages, 0);
  const beforeConsent = await request(`/api/MatchRequests/${pending.id}`, 'GET', b.token);
  assert.equal(beforeConsent.buddyLat, null);
  const firstNotification = nextEvent(hubB, 'LocationSharingUpdated');
  await request(`/api/MatchRequests/${pending.id}/share-location`, 'POST', a.token);
  const onlyA = await firstNotification;
  assert.equal(onlyA.buddyLat, latA);
  assert.equal(onlyA.buddyLng, lngA);
  assert.equal(onlyA.hasSharedLocation, false);
  assert.equal(onlyA.buddyHasSharedLocation, true);
  const aBeforeBShared = await request(`/api/MatchRequests/${pending.id}`, 'GET', a.token);
  assert.equal(aBeforeBShared.buddyLat, null);
  assert.equal(aBeforeBShared.hasSharedLocation, true);
  assert.equal(aBeforeBShared.buddyHasSharedLocation, false);
  const prematurePlace = await fetch(`${base}/api/MatchRequests/${pending.id}/meeting-place/google`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${a.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Quan thu', googleMapsUrl: 'https://www.google.com/maps/place/QuanThu' }),
  });
  assert.equal(prematurePlace.status, 403);

  const secondNotification = nextEvent(hubA, 'LocationSharingUpdated');
  await request(`/api/MatchRequests/${pending.id}/share-location`, 'POST', b.token);
  const both = await secondNotification;
  assert.equal(both.buddyLat, latB);
  assert.equal(both.buddyLng, lngB);
  const bView = await request(`/api/MatchRequests/${pending.id}`, 'GET', b.token);
  assert.equal(bView.buddyLat, latA);
  assert.equal(bView.buddyLng, lngA);
  assert.equal(bView.currentLat, undefined);
  assert.equal(bView.currentLng, undefined);
  assertNoSessionSecrets([pendingView, accepted, bView]);

  const suggestions = await request(
    `/api/MatchRequests/${pending.id}/meeting-suggestions`, 'GET', a.token);
  const embed = new URL(suggestions.embedUrl);
  const midpoint = `${(latA + latB) / 2},${(lngA + lngB) / 2}`;
  if (embed.pathname === '/maps/embed/v1/search') {
    assert.equal(embed.pathname, '/maps/embed/v1/search');
    assert.ok(embed.searchParams.get('key'));
    assert.equal(embed.searchParams.get('q'), 'quán ăn');
    assert.equal(embed.searchParams.get('center'), midpoint);
    assert.equal(embed.searchParams.get('zoom'), '15');
  } else {
    assert.equal(embed.hostname, 'maps.google.com');
    assert.equal(embed.searchParams.get('ll'), midpoint);
  }
  assert.equal(new URL(suggestions.searchUrl).hostname, 'www.google.com');

  const proposalEvent = nextEvent(hubB, 'MeetingPlaceUpdated');
  const proposal = await request(`/api/MatchRequests/${pending.id}/meeting-place/google`,
    'POST', a.token, { name: 'Quan thu', googleMapsUrl: 'https://www.google.com/maps/place/QuanThu' });
  const proposedForB = await proposalEvent;
  assert.equal(proposedForB.meetingPlace.id, proposal.meetingPlace.id);
  assert.equal(proposedForB.meetingPlace.googleMapsUrl, 'https://www.google.com/maps/place/QuanThu');
  await expectStatus(`/api/MatchRequests/${pending.id}/meeting-place/confirm`,
    'POST', a.token, 409, { placeId: proposal.meetingPlace.id });
  const confirmationEvent = nextEvent(hubA, 'MeetingPlaceUpdated');
  await request(`/api/MatchRequests/${pending.id}/meeting-place/confirm`,
    'POST', b.token, { placeId: proposal.meetingPlace.id });
  const confirmedForA = await confirmationEvent;
  assert.ok(confirmedForA.meetingPlace.agreedAt);
  assertNoSessionSecrets([proposal, proposedForB, confirmedForA]);

  expireConsent(pending.id, 'from');
  const aWhileOnlyBActive = await request(`/api/MatchRequests/${pending.id}`, 'GET', a.token);
  const bAfterAExpired = await request(`/api/MatchRequests/${pending.id}`, 'GET', b.token);
  assert.equal(aWhileOnlyBActive.buddyLat, latB);
  assert.equal(aWhileOnlyBActive.buddyLng, lngB);
  assert.equal(aWhileOnlyBActive.hasSharedLocation, false);
  assert.equal(aWhileOnlyBActive.buddyHasSharedLocation, true);
  assert.equal(aWhileOnlyBActive.meetingPlace, null);
  assert.equal(bAfterAExpired.buddyLat, null);
  assert.equal(bAfterAExpired.buddyLng, null);
  assert.equal(bAfterAExpired.hasSharedLocation, true);
  assert.equal(bAfterAExpired.buddyHasSharedLocation, false);
  assert.equal(bAfterAExpired.meetingPlace, null);

  expireConsent(pending.id);
  const expiredA = await request(`/api/MatchRequests/${pending.id}`, 'GET', a.token);
  const expiredB = await request(`/api/MatchRequests/${pending.id}`, 'GET', b.token);
  for (const expired of [expiredA, expiredB]) {
    assert.equal(expired.buddyLat, null);
    assert.equal(expired.buddyLng, null);
    assert.equal(expired.meetingPlace, null);
    assert.equal(expired.hasSharedLocation, false);
    assert.equal(expired.buddyHasSharedLocation, false);
  }
  const expiredSuggestions = await fetch(`${base}/api/MatchRequests/${pending.id}/meeting-suggestions`, {
    headers: { Authorization: `Bearer ${a.token}` },
  });
  assert.equal(expiredSuggestions.status, 403);
  const renewedByAEvent = nextEvent(hubB, 'LocationSharingUpdated');
  await request(`/api/MatchRequests/${pending.id}/share-location`, 'POST', a.token);
  const renewedByA = await renewedByAEvent;
  assert.equal(renewedByA.buddyLat, latA);
  assert.equal(renewedByA.hasSharedLocation, false);
  assert.equal(renewedByA.buddyHasSharedLocation, true);
  assert.equal(renewedByA.meetingPlace, null);
  const renewedByBEvent = nextEvent(hubA, 'LocationSharingUpdated');
  await request(`/api/MatchRequests/${pending.id}/share-location`, 'POST', b.token);
  const renewedByB = await renewedByBEvent;
  assert.equal(renewedByB.buddyLat, latB);
  assert.equal(renewedByB.meetingPlace, null);

  const revokedNotification = nextEvent(hubB, 'LocationSharingUpdated');
  await request(`/api/MatchRequests/${pending.id}/stop-sharing-location`, 'POST', a.token);
  const revoked = await revokedNotification;
  assert.equal(revoked.buddyLat, null);
  assert.equal(revoked.buddyLng, null);
  assert.equal(revoked.meetingPlace, null);
  assert.equal(revoked.hasSharedLocation, true);
  assert.equal(revoked.buddyHasSharedLocation, false);
  const afterAStopped = await request(`/api/MatchRequests/${pending.id}`, 'GET', a.token);
  assert.equal(afterAStopped.buddyLat, latB);
  assert.equal(afterAStopped.buddyLng, lngB);
  assert.equal(afterAStopped.hasSharedLocation, false);
  assert.equal(afterAStopped.buddyHasSharedLocation, true);
  assert.equal(outsiderNotifications, 0);
  assert.equal(outsiderMessages, 0);

  const ephemeral = shortToken(c.id);
  if (ephemeral) {
    const expiringHub = await hub('/hubs/match', ephemeral);
    const closed = new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Expired WebSocket remained open')), 8000);
      expiringHub.onclose(() => { clearTimeout(timer); resolve(); });
    });
    await closed;
    await assert.rejects(hub('/hubs/match', ephemeral));
    await expectStatus(`/api/MatchRequests/${pending.id}`, 'GET', ephemeral, 401);
  }

  let meetingLimit;
  for (const status of [403, 403, 429]) {
    meetingLimit = await expectStatus(`/api/MatchRequests/${pending.id}/meeting-suggestions`,
      'GET', c.token, status);
  }
  assert.ok(Number(meetingLimit.headers.get('retry-after')) > 0);
  let reportLimit;
  for (const status of [403, 403, 429]) {
    reportLimit = await expectStatus('/api/Reports', 'POST', c.token, status,
      { reportedTempUserId: a.id, reason: 'test outsider' });
  }
  assert.ok(Number(reportLimit.headers.get('retry-after')) > 0);

  const d = await request('/api/TempUsers', 'POST', undefined, { displayName: 'Signal D' });
  let hubLimit;
  for (let attempt = 0; attempt < 21; attempt++) {
    hubLimit = await expectStatus('/hubs/match/negotiate?negotiateVersion=1',
      'POST', d.token, attempt < 20 ? 200 : 429);
  }
  assert.ok(Number(hubLimit.headers.get('retry-after')) > 0);
  let apiLimit;
  for (let attempt = 0; attempt < 61; attempt++) {
    apiLimit = await expectStatus('/api/TempUsers/nearby', 'GET', d.token,
      attempt < 60 ? 409 : 429);
  }
  assert.ok(Number(apiLimit.headers.get('retry-after')) > 0);

  // The four profiles above use four permits in the anonymous CreateProfile window.
  let rateLimited = null;
  for (let attempt = 0; attempt < 7; attempt++) {
    rateLimited = await fetch(`${base}/api/TempUsers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ displayName: '' }),
    });
  }
  assert.equal(rateLimited.status, 429);
  assert.ok(Number(rateLimited.headers.get('retry-after')) > 0);

  expireProfile(a.id);
  await expectStatus(`/api/MatchRequests/${pending.id}`, 'GET', b.token, 404);
  await expectStatus('/api/MatchRequests/active', 'GET', b.token, 404);
  await expectStatus(`/api/Chat/${pending.id}/messages`, 'GET', b.token, 403);

  console.log('SignalR smoke passed: CORS/Origin, nearby visibility after GPS refresh, distant invitation rejected, chat A/B, exact coordinates, consent/60-minute expiry/revocation, expired profile access, Google place, outsider denial, token expiry, 429 retry on all local policies.');
} finally {
  await Promise.allSettled(connections.map(connection => connection.stop()));
}
