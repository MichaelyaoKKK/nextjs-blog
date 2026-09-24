import { createServer } from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'node:crypto';
import { join, resolve } from 'node:path';
import { defaultContent } from './default-content.mjs';

const root = resolve(import.meta.dirname, '..');
const pages = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/index.html', ['index.html', 'text/html; charset=utf-8']],
  ['/site.js', ['site.js', 'text/javascript; charset=utf-8']],
  ['/admin.html', ['admin.html', 'text/html; charset=utf-8']],
  ['/admin.js', ['admin.js', 'text/javascript; charset=utf-8']]
]);
const imageTypes = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' };

function reply(response, status, body, headers = {}) {
  if (Buffer.isBuffer(body)) {
    response.writeHead(status, { 'Content-Type': 'application/octet-stream', 'Cache-Control': 'no-store', ...headers });
    response.end(body);
    return;
  }
  const json = typeof body !== 'string';
  response.writeHead(status, { 'Content-Type': json ? 'application/json; charset=utf-8' : 'text/plain; charset=utf-8', 'Cache-Control': 'no-store', ...headers });
  response.end(json ? JSON.stringify(body) : body);
}

async function readJson(path, fallback) {
  try { return JSON.parse(await readFile(path, 'utf8')); }
  catch (error) { if (error.code === 'ENOENT') return fallback; throw error; }
}

async function bodyJson(request, limit = 6_000_000) {
  let size = 0;
  const chunks = [];
  for await (const chunk of request) {
    size += chunk.length;
    if (size > limit) { const error = new Error('请求内容过大'); error.status = 413; throw error; }
    chunks.push(chunk);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { const error = new Error('无效的 JSON'); error.status = 400; throw error; }
}

function validateContent(value) {
  if (!value || typeof value !== 'object') return false;
  for (const group of ['preview', 'works', 'daily']) {
    if (!Array.isArray(value[group]) || value[group].length !== defaultContent[group].length) return false;
    for (let i = 0; i < value[group].length; i++) {
      const item = value[group][i];
      if (!item || item.id !== defaultContent[group][i].id || item.theme !== defaultContent[group][i].theme) return false;
      if (!['title', 'category', 'description', 'mark', 'image'].every((key) => typeof item[key] === 'string')) return false;
      if (!item.title.trim() || item.title.length > 80 || item.category.length > 40 || item.description.length > 500 || item.mark.length > 4) return false;
      if (item.image && !/^\/uploads\/[a-f0-9-]{36}\.(png|jpg|webp)$/.test(item.image)) return false;
    }
  }
  return true;
}

function validImage(buffer, mime) {
  if (mime === 'image/png') return buffer.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  if (mime === 'image/jpeg') return buffer[0] === 255 && buffer[1] === 216 && buffer[buffer.length - 2] === 255 && buffer[buffer.length - 1] === 217;
  if (mime === 'image/webp') return buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP';
  return false;
}

export function createApp({ dataDir = join(root, 'storage'), siteDir = root } = {}) {
  const accountFile = join(dataDir, 'admin.json');
  const contentFile = join(dataDir, 'content.json');
  const uploadDir = join(dataDir, 'uploads');
  const sessions = new Map();
  const attempts = new Map();

  async function account() { return readJson(accountFile, null); }
  async function content() { return readJson(contentFile, defaultContent); }
  async function save(path, value) {
    await mkdir(dataDir, { recursive: true });
    await writeFile(path, JSON.stringify(value, null, 2), { flag: 'w', mode: 0o600 });
  }
  function authenticated(request) {
    const token = /(?:^|;\s*)alisa_session=([a-f0-9]{64})(?:;|$)/.exec(request.headers.cookie || '')?.[1];
    return token && sessions.has(token) ? token : null;
  }
  function issueSession(response) {
    const token = randomBytes(32).toString('hex');
    sessions.set(token, Date.now() + 12 * 60 * 60 * 1000);
    response.setHeader('Set-Cookie', `alisa_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=43200`);
  }
  function authorized(request) {
    const token = authenticated(request);
    if (!token) return false;
    if (sessions.get(token) < Date.now()) { sessions.delete(token); return false; }
    return true;
  }
  function sameOrigin(request) {
    if (!request.headers.origin) return true;
    return request.headers.origin === `http://${request.headers.host}`;
  }

  return createServer(async (request, response) => {
    try {
      const path = new URL(request.url, 'http://localhost').pathname;
      if (request.method === 'GET' && pages.has(path)) {
        const [file, type] = pages.get(path);
        reply(response, 200, await readFile(join(siteDir, file), 'utf8'), { 'Content-Type': type });
        return;
      }
      if (request.method === 'GET' && path.startsWith('/uploads/')) {
        const match = /^\/uploads\/([a-f0-9-]{36})\.(png|jpg|webp)$/.exec(path);
        if (!match) return reply(response, 404, { error: '未找到图片' });
        const bytes = await readFile(join(uploadDir, match[1] + '.' + match[2]));
        reply(response, 200, bytes, { 'Content-Type': match[2] === 'jpg' ? 'image/jpeg' : 'image/' + match[2] });
        return;
      }
      if (path === '/api/content' && request.method === 'GET') return reply(response, 200, await content());
      if (path === '/api/session' && request.method === 'GET') return reply(response, 200, { authenticated: authorized(request), setupRequired: !(await account()) });
      if (request.method !== 'POST' || !path.startsWith('/api/')) return reply(response, 404, { error: '未找到页面' });
      if (!sameOrigin(request)) return reply(response, 403, { error: '请求来源无效' });
      if (path === '/api/setup') {
        if (await account()) return reply(response, 409, { error: '管理员账户已存在' });
        const body = await bodyJson(request);
        if (typeof body.username !== 'string' || !/^[a-zA-Z0-9_-]{3,32}$/.test(body.username) || typeof body.password !== 'string' || body.password.length < 12 || body.password.length > 128) return reply(response, 400, { error: '用户名需为 3–32 位字母或数字，密码至少 12 位' });
        const salt = randomBytes(16).toString('hex');
        await save(accountFile, { username: body.username, salt, hash: scryptSync(body.password, salt, 64).toString('hex') });
        issueSession(response);
        return reply(response, 200, { ok: true });
      }
      if (path === '/api/login') {
        const key = request.socket.remoteAddress || 'local';
        const recent = (attempts.get(key) || []).filter((time) => Date.now() - time < 60_000);
        if (recent.length >= 5) return reply(response, 429, { error: '尝试过多，请稍后再试' });
        const body = await bodyJson(request, 10000);
        const saved = await account();
        const candidate = saved && typeof body.password === 'string' ? scryptSync(body.password, saved.salt, 64) : null;
        if (!saved || body.username !== saved.username || !candidate || !timingSafeEqual(candidate, Buffer.from(saved.hash, 'hex'))) {
          attempts.set(key, [...recent, Date.now()]);
          return reply(response, 401, { error: '用户名或密码错误' });
        }
        attempts.delete(key);
        issueSession(response);
        return reply(response, 200, { ok: true });
      }
      if (path === '/api/logout') {
        const token = authenticated(request);
        if (token) sessions.delete(token);
        response.setHeader('Set-Cookie', 'alisa_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0');
        return reply(response, 200, { ok: true });
      }
      if (!authorized(request)) return reply(response, 401, { error: '请先登录管理员账户' });
      if (path === '/api/content') {
        const next = await bodyJson(request, 100_000);
        if (!validateContent(next)) return reply(response, 400, { error: '内容格式无效' });
        await save(contentFile, next);
        return reply(response, 200, { ok: true });
      }
      if (path === '/api/upload') {
        const body = await bodyJson(request);
        if (!imageTypes[body.mime] || typeof body.data !== 'string' || !/^[A-Za-z0-9+/=]+$/.test(body.data)) return reply(response, 400, { error: '仅支持 PNG、JPEG 或 WebP 图片' });
        const bytes = Buffer.from(body.data, 'base64');
        if (bytes.length < 12 || bytes.length > 3_000_000 || !validImage(bytes, body.mime)) return reply(response, 400, { error: '图片无效或超过 3 MB' });
        await mkdir(uploadDir, { recursive: true });
        const filename = `${randomUUID()}.${imageTypes[body.mime]}`;
        await writeFile(join(uploadDir, filename), bytes, { flag: 'wx' });
        return reply(response, 200, { url: `/uploads/${filename}` });
      }
      reply(response, 404, { error: '未找到接口' });
    } catch (error) {
      if (error.code === 'ENOENT') return reply(response, 404, { error: '文件不存在' });
      reply(response, error.status || 500, { error: error.status ? error.message : '服务器处理失败' });
    }
  });
}
