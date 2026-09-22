import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const page = await readFile(new URL('../src/pages/index.astro', import.meta.url), 'utf8');

test('homepage includes every planned content section', () => {
  for (const id of ['about', 'works', 'daily', 'contact']) assert.match(page, new RegExp(`id=\\"${id}\\"`));
});

test('homepage includes accessible navigation and contact controls', () => {
  assert.match(page, /aria-label="切换明暗模式"/);
  assert.match(page, /type="submit"/);
  assert.match(page, /mailto:hello@alisa\.art/);
});

test('homepage includes responsive layout and motion safeguards', () => {
  assert.match(page, /overflow-x-hidden/);
  assert.match(page, /grid-flow-dense/);
  assert.match(page, /ScrollTrigger/);
});
