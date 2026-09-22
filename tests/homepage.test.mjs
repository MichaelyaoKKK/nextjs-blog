import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const page = await readFile(new URL('../index.html', import.meta.url), 'utf8');

test('homepage includes every planned content section', () => {
  for (const id of ['about', 'universe', 'daily']) assert.match(page, new RegExp(`id=\\"${id}\\"`));
});

test('homepage includes accessible navigation and protects child contact details', () => {
  assert.match(page, /aria-label="切换明暗模式"/);
  assert.match(page, /联系渠道由家长管理/);
  assert.doesNotMatch(page, /mailto:/);
  assert.doesNotMatch(page, /<form/);
});

test('homepage includes responsive layout and motion safeguards', () => {
  assert.match(page, /overflow-x:hidden/);
  assert.match(page, /grid-auto-flow:dense/);
  assert.match(page, /ScrollTrigger/);
});
