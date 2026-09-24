import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { once } from 'node:events';
import { createApp } from '../server/app.mjs';
import { defaultContent } from '../server/default-content.mjs';

test('admin setup, login, image upload and content editing require authentication', async () => {
  const dataDir = await mkdtemp(join(tmpdir(), 'alisa-admin-test-'));
  const server = createApp({ dataDir });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}`;
  const post = (path, data, cookie = '') => fetch(base + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) },
    body: JSON.stringify(data)
  });

  try {
    const initial = await (await fetch(base + '/api/session')).json();
    assert.deepEqual(initial, { authenticated: false, setupRequired: true });
    assert.equal((await post('/api/content', defaultContent)).status, 401);
    assert.equal((await post('/api/setup', { username: 'parent', password: 'short' })).status, 400);

    const setup = await post('/api/setup', { username: 'parent', password: 'long-secure-passphrase' });
    assert.equal(setup.status, 200);
    const cookie = setup.headers.get('set-cookie').split(';')[0];
    const savedAccount = JSON.parse(await readFile(join(dataDir, 'admin.json'), 'utf8'));
    assert.equal(savedAccount.username, 'parent');
    assert.ok(!JSON.stringify(savedAccount).includes('long-secure-passphrase'));
    assert.equal((await post('/api/setup', { username: 'other', password: 'another-passphrase' })).status, 409);
    assert.equal((await post('/api/login', { username: 'parent', password: 'wrong-passphrase' })).status, 401);

    const image = Buffer.from('89504e470d0a1a0a00000000', 'hex');
    assert.equal((await post('/api/upload', { mime: 'image/png', data: image.toString('base64') })).status, 401);
    const uploadResponse = await post('/api/upload', { mime: 'image/png', data: image.toString('base64') }, cookie);
    const uploaded = await uploadResponse.json();
    assert.equal(uploadResponse.status, 200, JSON.stringify(uploaded));
    assert.match(uploaded.url, /^\/uploads\/[a-f0-9-]{36}\.png$/);
    const imageResponse = await fetch(base + uploaded.url);
    assert.equal(imageResponse.headers.get('content-type'), 'image/png');
    assert.deepEqual(Buffer.from(await imageResponse.arrayBuffer()), image);
    assert.equal((await post('/api/upload', { mime: 'text/html', data: image.toString('base64') }, cookie)).status, 400);

    const content = structuredClone(defaultContent);
    content.preview[0].title = '新的画作';
    content.preview[0].image = uploaded.url;
    content.works[1].title = '新猫咪';
    content.daily[2].description = '新的绘画过程';
    assert.equal((await post('/api/content', content, cookie)).status, 200);
    assert.deepEqual(await (await fetch(base + '/api/content')).json(), content);
    assert.equal((await post('/api/content', { preview: [] }, cookie)).status, 400);

    assert.equal((await post('/api/logout', {}, cookie)).status, 200);
    assert.equal((await post('/api/content', content, cookie)).status, 401);
    const login = await post('/api/login', { username: 'parent', password: 'long-secure-passphrase' });
    assert.equal(login.status, 200);
    assert.equal((await (await fetch(base + '/api/session', { headers: { Cookie: login.headers.get('set-cookie').split(';')[0] } })).json()).authenticated, true);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    if (dataDir.startsWith(join(tmpdir(), 'alisa-admin-test-'))) await rm(dataDir, { recursive: true, force: true });
  }
});
