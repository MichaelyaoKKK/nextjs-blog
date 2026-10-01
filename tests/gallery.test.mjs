import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { albumPath, coverImage, coverPhoto, galleryImages, galleryPhotos, validateAlbumEntries } from '../src/lib/gallery.mjs';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');
const works = JSON.parse(await read('../src/data/works.json'));
const daily = JSON.parse(await read('../src/data/daily.json'));
const config = await read('../.pages.yml');
const galleryPage = await read('../src/components/GalleryPage.astro');

test('albums use stable URLs, one shared image list, and a selectable cover', () => {
  assert.equal(albumPath('zh', 'works', 'cloud-puppy'), '/works/cloud-puppy/');
  assert.equal(albumPath('en', 'works', 'cloud-puppy'), '/en/works/cloud-puppy/');
  assert.equal(albumPath('fr', 'daily', 'color-diary'), '/fr/daily/color-diary/');
  const album = { slug: 'example', image: '/images/second.jpg', gallery: [
    { image: '/images/first.jpg', title: 'First drawing' },
    { image: '/images/second.jpg', title: 'Second drawing' }
  ] };
  validateAlbumEntries([album], 'works');
  assert.deepEqual(galleryPhotos(album), album.gallery);
  assert.deepEqual(galleryImages(album), ['/images/first.jpg', '/images/second.jpg']);
  assert.equal(coverImage(album), '/images/second.jpg');
  assert.equal(coverPhoto(album)?.title, 'Second drawing');
  assert.equal(coverImage({ gallery: album.gallery }), '/images/first.jpg');
  assert.equal(coverPhoto({ gallery: album.gallery })?.title, 'First drawing');
  assert.equal(coverImage({ gallery: [] }), '');
  validateAlbumEntries([{ slug: 'empty-album' }], 'daily');
});

test('invalid or duplicate gallery data blocks publishing', () => {
  const photo = { image: '/images/cover.jpg', title: 'A drawing' };
  const album = { slug: 'sample', image: photo.image, gallery: [photo] };
  assert.throws(() => validateAlbumEntries([album, album], 'works'), /unique lowercase slug/);
  assert.throws(() => validateAlbumEntries([{ ...album, image: '/images/other.jpg' }], 'works'), /cover image must also be in the gallery/);
  assert.throws(() => validateAlbumEntries([{ ...album, gallery: [photo, photo] }], 'works'), /duplicate images/);
  assert.throws(() => validateAlbumEntries([{ ...album, gallery: [{ ...photo, image: '/elsewhere/cover.jpg' }] }], 'works'), /local image paths/);
  assert.throws(() => validateAlbumEntries([{ ...album, gallery: [{ ...photo, title: 'cover.jpg' }] }], 'works'), /name without a file extension/);
  assert.throws(() => validateAlbumEntries([{ ...album, gallery: [{ ...photo, title: ' ' }] }], 'works'), /name without a file extension/);
  assert.throws(() => validateAlbumEntries([{ ...album, gallery: ['/images/cover.jpg'] }], 'works'), /local image paths/);
});

test('existing covers are retained in their albums and all images exist', async () => {
  for (const [collection, entries] of [['works', works], ['daily', daily]]) {
    validateAlbumEntries(entries, collection);
    for (const entry of entries) {
      for (const photo of galleryPhotos(entry)) {
        assert.match(photo.title, /[A-Za-z]/);
        const file = new URL(`../public${photo.image}`, import.meta.url);
        const artwork = await stat(file).catch(() => null);
        assert.ok(artwork?.isFile(), `${collection}/${entry.slug}: ${photo.image} must exist`);
      }
    }
  }
});

test('Pages CMS offers editable English photo names beside each image', () => {
  for (const collection of ['works', 'daily']) {
    const section = config.split(`- name: ${collection}\n`)[1];
    assert.ok(section, collection);
    assert.match(section, /name: slug,.*required: true/);
    assert.match(section, /name: image,.*type: image/);
    assert.match(section, /name: gallery[\s\S]*?type: object[\s\S]*?list:\s+max: 30[\s\S]*?summary: "\{title\}"[\s\S]*?name: image,.*type: image, required: true[\s\S]*?name: title,.*type: string, required: true/);
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
  assert.match(galleryPage, /data-gallery-title aria-live="polite"/);
  assert.match(galleryPage, /data-gallery-hover-title/);
  assert.match(galleryPage, /data-title=\{photo\.title\}/);
  assert.match(galleryPage, /title\.textContent = image\.alt/);
  assert.match(galleryPage, /aria-live="polite"/);
  assert.match(galleryPage, /event\.key === 'ArrowLeft'/);
  assert.match(galleryPage, /event\.key === 'ArrowRight'/);
  assert.match(galleryPage, /labels\.empty/);
  assert.match(galleryPage, /object-contain/);
});
