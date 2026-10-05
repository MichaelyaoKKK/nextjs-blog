import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { canZoomToOriginal } from '../src/lib/image-viewer.mjs';

const homepage = await readFile(new URL('../src/components/PortfolioPage.astro', import.meta.url), 'utf8');
const album = await readFile(new URL('../src/components/GalleryPage.astro', import.meta.url), 'utf8');

test('only images larger than the available viewport can zoom to original pixels', () => {
  assert.equal(canZoomToOriginal(1600, 900, 1000, 800), true);
  assert.equal(canZoomToOriginal(800, 1600, 1000, 800), true);
  assert.equal(canZoomToOriginal(800, 600, 1000, 800), false);
  assert.equal(canZoomToOriginal(0, 0, 1000, 800), false);
});

test('work and daily cover images link to their albums without opening the viewer', () => {
  const works = homepage.split('<section id="works"')[1].split('<section id="daily"')[0];
  const daily = homepage.split('<section id="daily"')[1].split('<section id="contact"')[0];
  for (const section of [works, daily]) {
    assert.match(section, /<a href=\{withBasePath\(base, albumPath\(locale,/);
    assert.doesNotMatch(section, /data-preview-image|cursor-zoom-in/);
  }
  assert.doesNotMatch(homepage, /<dialog|data-viewer-image/);
});

test('album viewer opens the currently selected image and toggles fit versus source pixels', () => {
  assert.match(album, /<button type="button" data-gallery-open/);
  assert.match(album, /<dialog id="gallery-viewer"/);
  assert.match(album, /data-viewer-zoom aria-pressed="false"/);
  assert.match(album, /openButton\?\.setAttribute\('aria-label'/);
  assert.match(album, /viewerImage\.src = image\.src/);
  assert.match(album, /viewerImage\?\.addEventListener\('dblclick'/);
  assert.match(album, /viewerImage\.naturalWidth/);
  assert.match(album, /viewerImage\.naturalHeight/);
  assert.match(album, /viewerImage\.style\.maxWidth = zoomed \? 'none' : ''/);
  assert.match(album, /viewer\?\.addEventListener\('close'/);
  assert.match(album, /openButton\?\.focus\(\)/);
  for (const locale of ['zh', 'en', 'fr']) assert.match(album, new RegExp(`  ${locale}: \\{[^\\n]*dialog:`));
});
