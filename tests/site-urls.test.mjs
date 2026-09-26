import test from 'node:test';
import assert from 'node:assert/strict';
import { withBasePath } from '../src/lib/site-urls.mjs';

test('language routes work at the site root', () => {
  assert.equal(withBasePath('/', '/'), '/');
  assert.equal(withBasePath('/', '/en/'), '/en/');
  assert.equal(withBasePath('/', '/fr/'), '/fr/');
});

test('language routes work under the GitHub Pages project path', () => {
  assert.equal(withBasePath('/nextjs-blog', '/'), '/nextjs-blog/');
  assert.equal(withBasePath('/nextjs-blog', '/en/'), '/nextjs-blog/en/');
  assert.equal(withBasePath('/nextjs-blog', '/fr/'), '/nextjs-blog/fr/');
});

test('one CMS image path works locally and on GitHub Pages', () => {
  assert.equal(withBasePath('/', '/images/drawing.png'), '/images/drawing.png');
  assert.equal(withBasePath('/nextjs-blog', '/images/drawing.png'), '/nextjs-blog/images/drawing.png');
});
