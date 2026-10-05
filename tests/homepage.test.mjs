import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { coverImage } from '../src/lib/gallery.mjs';

const read = async (path) => readFile(new URL(path, import.meta.url), 'utf8');
const source = await read('../src/components/PortfolioPage.astro');
const config = await read('../.pages.yml');
const readme = await read('../README.md');
const pages = Object.fromEntries(await Promise.all(
  ['zh', 'en', 'fr'].map(async (locale) => [
    locale,
    JSON.parse(await read(`../src/data/page${locale === 'zh' ? '' : `.${locale}`}.json`))
  ])
));
const works = JSON.parse(await read('../src/data/works.json'));
const daily = JSON.parse(await read('../src/data/daily.json'));

test('three static routes share one homepage component', async () => {
  await assert.rejects(stat(new URL('../index.html', import.meta.url)), { code: 'ENOENT' });
  for (const [route, locale] of [['../src/pages/index.astro', 'zh'], ['../src/pages/en/index.astro', 'en'], ['../src/pages/fr/index.astro', 'fr']]) {
    const wrapper = await read(route);
    assert.match(wrapper, /PortfolioPage\.astro/);
    assert.match(wrapper, new RegExp(`locale="${locale}"`));
  }
  for (const id of ['about', 'works', 'daily', 'contact']) assert.match(source, new RegExp(`id="${id}"`));
  assert.match(source, /ScrollTrigger/);
  assert.doesNotMatch(source, /mailto:|<form\b/i);
});

test('repository guide points to the connected GitHub project', () => {
  assert.match(readme, /https:\/\/github\.com\/MichaelyaoKKK\/nextjs-blog/);
  assert.doesNotMatch(readme, /尚未连接 GitHub/);
});

test('language switcher uses accessible localized static routes', () => {
  assert.match(source, /<html lang=\{htmlLang\}/);
  for (const route of ['/', '/en/', '/fr/']) assert.ok(source.includes(`href: withBasePath(base, '${route}')`));
  for (const locale of ['zh-CN', 'en', 'fr']) assert.ok(source.includes(`hreflang="${locale}"`));
  assert.match(source, /aria-current=\{locale === language\.code \? 'page'/);
  assert.match(source, /aria-label=\{page\.languageSwitcherLabel\}/);
  assert.match(source, /rel="canonical" href=\{canonicalSiteUrl\(canonicalPath\)\}/);
  assert.match(source, /hreflang="x-default" href=\{canonicalSiteUrl\('\/'\)\}/);
});

test('only the Chinese hero headline uses the smaller type scale', () => {
  assert.match(source, /locale === 'zh' \? 'text-\[clamp\(3\.1rem,6vw,5\.5rem\)\] leading-\[1\.1\]' : 'text-\[clamp\(3\.6rem,8vw,8\.2rem\)\] leading-\[0\.84\]'/);
  assert.match(source, /\{page\.heroTitleFirst\}<br \/>\{page\.heroTitleSecond\}/);
});

test('portfolio layout keeps the navigation in flow and uploaded art unfiltered', () => {
  assert.match(source, /<nav class="mx-auto mt-5 flex /);
  assert.doesNotMatch(source, /<nav class="[^"]*\b(?:fixed|sticky)\b/);
  assert.match(source, /<section id="top" class="[^"]*\bpt-12\b/);
  assert.match(source, /<img class="[^"]*object-cover" src=\{pageZh\.heroImage/);
  assert.doesNotMatch(source, /mix-blend-multiply|contrast-110|saturate-125/);
  assert.match(source, /<section id="contact"[\s\S]*?<div class="mx-auto max-w-7xl rounded-\[2rem\] bg-\[\#ef596f\]/);
});

test('work covers form a staggered gallery with complete artwork and separate captions', () => {
  const worksMarkup = source.split('<section id="works"')[1].split('<section id="daily"')[0];
  assert.match(source, /const secondWorkColumnStart = Math\.ceil\(displayedWorks\.length \/ 2\)/);
  assert.match(worksMarkup, /sm:columns-2 sm:gap-7/);
  assert.match(worksMarkup, /mb-6 break-inside-avoid/);
  assert.match(worksMarkup, /index === secondWorkColumnStart \? 'sm:mt-14 sm:break-before-column'/);
  assert.match(worksMarkup, /<button type="button" data-preview-image[\s\S]*?<img[^>]+block h-auto w-full object-contain/);
  assert.doesNotMatch(worksMarkup, /aspect-\[/);
  assert.doesNotMatch(worksMarkup, /object-cover|bg-gradient-to-t|group-hover:scale/);
  assert.match(worksMarkup, /<\/div>\s*<a href=\{withBasePath\(base, albumPath\(locale, 'works', work\.slug\)\)\} class="block p-6/);
  assert.doesNotMatch(source, /toArray<HTMLElement>\('\.work-card/);
});

test('all localized page fields are editable and populated', () => {
  const chineseKeys = Object.keys(pages.zh).filter((key) => key !== 'heroImage').sort();
  for (const locale of ['zh', 'en', 'fr']) {
    const page = pages[locale];
    assert.deepEqual(Object.keys(page).filter((key) => key !== 'heroImage').sort(), chineseKeys);
    for (const [key, value] of Object.entries(page)) {
      assert.match(config, new RegExp(`name: ${key}(?:,|\\s)`));
      if (key !== 'heroImage') assert.ok(source.includes(`page.${key}`), `${key} must be rendered`);
      if (Array.isArray(value)) assert.ok(value.length && value.every((item) => typeof item === 'string' && item.trim()));
      else assert.equal(typeof value, 'string');
      if (key !== 'heroImage') assert.ok(Array.isArray(value) || value.trim());
    }
    assert.ok(!('contactBody' in page));
  }
  assert.match(config, /name: contactNote(?:,|\s)/);
  assert.match(source, /pageZh\.heroImage \? withBasePath\(base, pageZh\.heroImage\)/);
  for (const locale of ['en', 'fr']) assert.match(config, new RegExp(`path: src/data/page\\.${locale}\\.json`));
  assert.match(config, /input: public\/images\s+output: \/images/);
});

test('works and daily have translations and editable albums', () => {
  assert.ok(works.length >= 4);
  assert.ok(daily.length >= 3);
  for (const [entries, fields] of [
    [works, ['slug', 'title', 'titleEn', 'titleFr', 'category', 'categoryEn', 'categoryFr', 'note', 'noteEn', 'noteFr', 'image', 'gallery']],
    [daily, ['slug', 'title', 'titleEn', 'titleFr', 'copy', 'copyEn', 'copyFr', 'image', 'gallery']]
  ]) {
    for (const entry of entries) {
      for (const field of fields.filter((name) => !['image', 'gallery'].includes(name))) {
        assert.equal(typeof entry[field], 'string');
        assert.ok(entry[field].trim(), `${field} must be populated`);
      }
      if (entry.image !== undefined) assert.match(entry.image, /^(?:|\/images\/.+)$/);
      assert.ok(entry.gallery === undefined || Array.isArray(entry.gallery));
      if (entry.gallery?.length) assert.ok(entry.gallery.some((photo) => photo.image === coverImage(entry)), 'displayed cover must be in gallery');
    }
    for (const field of fields) assert.match(config, new RegExp(`name: ${field}(?:,|\\s)`));
  }
  assert.match(source, /work\.image \? withBasePath\(base, work\.image\)/);
  assert.match(source, /project\.image \? withBasePath\(base, project\.image\)/);
  assert.match(source, /coverPhoto\(work\)\?\.title/);
  assert.match(source, /coverPhoto\(item\)\?\.title/);
  assert.match(source, /group-hover:opacity-100 group-focus-within:opacity-100/);
  assert.match(source, /albumPath\(locale, 'works', work\.slug\)/);
  assert.match(source, /albumPath\(locale, 'daily', project\.slug\)/);
});
