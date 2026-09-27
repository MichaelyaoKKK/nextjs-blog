import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { albumPath, coverImage, galleryImages, validateAlbumEntries } from '../src/lib/gallery.mjs';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');
const works = JSON.parse(await read('../src/data/works.json'));
const daily = JSON.parse(await read('../src/data/daily.json'));
const config = await read('../.pages.yml');
const galleryPage = await read('../src/components/GalleryPage.astro');

test('albums use stable URLs, one shared image list, and a selectable cover', () => {
  assert.equal(albumPath('zh', 'works', 'cloud-puppy'), '/works/cloud-puppy/');
  assert.equal(albumPath('en', 'works', 'cloud-puppy'), '/en/works/cloud-puppy/');
  assert.equal(albumPath('fr', 'daily', 'color-diary'), '/fr/daily/color-diary/');
  const album = { slug: 'example', image: '/images/second.jpg', gallery: ['/images/first.jpg', '/images/second.jpg'] };
  validateAlbumEntries([album], 'works');
  assert.deepEqual(galleryImages(album), album.gallery);
  assert.equal(coverImage(album), '/images/second.jpg');
  assert.equal(coverImage({ gallery: album.gallery }), '/images/first.jpg');
  assert.equal(coverImage({ gallery: [] }), '');
  validateAlbumEntries([{ slug: 'empty-album' }], 'daily');
});

test('invalid or duplicate gallery data blocks publishing', () => {
  const album = { slug: 'sample', image: '/images/cover.jpg', gallery: ['/images/cover.jpg'] };
  assert.throws(() => validateAlbumEntries([album, album], 'works'), /unique lowercase slug/);
  assert.throws(() => validateAlbumEntries([{ ...album, image: '/images/other.jpg' }], 'works'), /cover image must also be in the gallery/);
  assert.throws(() => validateAlbumEntries([{ ...album, gallery: ['/images/cover.jpg', '/images/cover.jpg'] }], 'works'), /duplicate images/);
  assert.throws(() => validateAlbumEntries([{ ...album, gallery: ['/elsewhere/cover.jpg'] }], 'works'), /local image paths/);
});

test('existing covers are retained in their albums and all images exist', async () => {
  for (const [collection, entries] of [['works', works], ['daily', daily]]) {
    validateAlbumEntries(entries, collection);
    for (const entry of entries) {
      for (const image of entry.gallery) {
        const file = new URL(`../public${image}`, import.meta.url);
        assert.ok((await stat(file)).isFile(), `${collection}/${entry.slug}: ${image}`);
      }
    }
  }
});

test('Pages CMS offers multi-image galleries and separate cover pickers', () => {
  for (const collection of ['works', 'daily']) {
    const section = config.split(`- name: ${collection}\n`)[1];
    assert.ok(section, collection);
    assert.match(section, /name: slug,.*required: true/);
    assert.match(section, /name: image,.*type: image/);
    assert.match(section, /name: gallery[\s\S]*?type: image[\s\S]*?multiple:\s+max: 30[\s\S]*?unique: true/);
  }
});

test('all locales render static album routes with keyboard-friendly browsing and empty state', async () => {
  for (const route of [
    '../src/pages/[collection]/[slug].astro',
    '../src/pages/en/[collection]/[slug].astro',
    '../src/pages/fr/[collection]/[slug].astro'
  ]) {
    const source = await read(route);
    assert.match(source, /getStaticPaths/);
    assert.match(source, /GalleryPage/);
  }
  assert.match(galleryPage, /data-gallery-main/);
  assert.match(galleryPage, /data-gallery-previous/);
  assert.match(galleryPage, /data-gallery-next/);
  assert.match(galleryPage, /data-gallery-thumb/);
  assert.match(galleryPage, /aria-live="polite"/);
  assert.match(galleryPage, /event\.key === 'ArrowLeft'/);
  assert.match(galleryPage, /event\.key === 'ArrowRight'/);
  assert.match(galleryPage, /labels\.empty/);
  assert.match(galleryPage, /object-contain/);
});
