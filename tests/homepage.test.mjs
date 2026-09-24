import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const page = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const client = await readFile(new URL('../site.js', import.meta.url), 'utf8');

test('public page has the three editable module groups and the parent contact address', () => {
  for (const selector of ['mini-gallery', 'bento', 'daily-list']) assert.match(page, new RegExp(selector));
  assert.match(page, /luckyalicelin@gmail\.com/);
  assert.match(page, /家长联系邮箱：/);
  assert.doesNotMatch(page, /由家长管理联系邮箱。请勿在邮件中分享/);
  assert.match(page, /管理员入口/);
  assert.match(page, /site\.js/);
});

test('client loads saved content and renders visitor text without HTML injection', () => {
  assert.match(client, /fetch\('\/api\/content'/);
  assert.match(client, /textContent = text/);
  assert.match(client, /data\.preview/);
  assert.match(client, /data\.works/);
  assert.match(client, /data\.daily/);
});
