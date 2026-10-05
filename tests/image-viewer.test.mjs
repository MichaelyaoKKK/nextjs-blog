import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { canZoomToOriginal } from '../src/lib/image-viewer.mjs';

const source = await readFile(new URL('../src/components/PortfolioPage.astro', import.meta.url), 'utf8');

test('only images larger than the available viewport can zoom to original pixels', () => {
  assert.equal(canZoomToOriginal(1600, 900, 1000, 800), true);
  assert.equal(canZoomToOriginal(800, 1600, 1000, 800), true);
  assert.equal(canZoomToOriginal(800, 600, 1000, 800), false);
  assert.equal(canZoomToOriginal(0, 0, 1000, 800), false);
});

test('work and daily covers have separate preview controls and album links', () => {
  const works = source.split('<section id="works"')[1].split('<section id="daily"')[0];
  const daily = source.split('<section id="daily"')[1].split('<section id="contact"')[0];
  for (const section of [works, daily]) {
    assert.match(section, /<button type="button" data-preview-image/);
    assert.match(section, /data-preview-src=/);
    assert.match(section, /albumPath\(locale,/);
  }
  assert.doesNotMatch(daily, /after:absolute after:inset-0/);
});

test('shared accessible viewer toggles fit and intrinsic size without scaling past the source', () => {
  assert.match(source, /<dialog id="cover-viewer"/);
  assert.match(source, /data-viewer-zoom aria-pressed="false"/);
  assert.match(source, /viewerImage\?\.addEventListener\('dblclick'/);
  assert.match(source, /viewerImage\.naturalWidth/);
  assert.match(source, /viewerImage\.naturalHeight/);
  assert.match(source, /viewerImage\.style\.maxWidth = zoomed \? 'none' : ''/);
  assert.match(source, /viewer\?\.addEventListener\('close'/);
  assert.match(source, /opener\?\.focus\(\)/);
  for (const locale of ['zh', 'en', 'fr']) assert.match(source, new RegExp(`  ${locale}: \\{ dialog:`));
});
