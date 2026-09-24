import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';

const read = async (path) => readFile(new URL(path, import.meta.url), 'utf8');
const source = await read('../src/components/PortfolioPage.astro');
const config = await read('../.pages.yml');
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

test('language switcher uses accessible localized static routes', () => {
  assert.match(source, /<html lang=\{htmlLang\}/);
  for (const route of ['/', '/en/', '/fr/']) assert.ok(source.includes(`href: '${route}'`));
  for (const locale of ['zh-CN', 'en', 'fr']) assert.ok(source.includes(`hreflang="${locale}"`));
  assert.match(source, /aria-current=\{locale === language\.code \? 'page'/);
  assert.match(source, /aria-label=\{page\.languageSwitcherLabel\}/);
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
    assert.ok(page.contactNote.includes('luckyalicelin@gmail.com'));
    assert.ok(!('contactBody' in page));
  }
  assert.equal(pages.zh.contactNote, 'Alisa妈妈邮箱：luckyalicelin@gmail.com');
  assert.match(source, /src=\{pageZh\.heroImage \|\|/);
  for (const locale of ['en', 'fr']) assert.match(config, new RegExp(`path: src/data/page\\.${locale}\\.json`));
  assert.match(config, /input: public\/images\s+output: \/images/);
});

test('works and daily have translations and shared optional images', () => {
  assert.ok(works.length >= 4);
  assert.ok(daily.length >= 3);
  for (const [entries, fields] of [
    [works, ['title', 'titleEn', 'titleFr', 'category', 'categoryEn', 'categoryFr', 'note', 'noteEn', 'noteFr', 'image']],
    [daily, ['title', 'titleEn', 'titleFr', 'copy', 'copyEn', 'copyFr', 'image']]
  ]) {
    for (const entry of entries) {
      assert.deepEqual(Object.keys(entry).sort(), [...fields].sort());
      for (const field of fields.filter((name) => name !== 'image')) assert.ok(entry[field].trim());
      assert.match(entry.image, /^(?:|\/images\/.+)$/);
    }
    for (const field of fields) assert.match(config, new RegExp(`name: ${field}(?:,|\\s)`));
  }
  assert.match(source, /work\.image \|\| workPlaceholders/);
  assert.match(source, /project\.image \|\| dailyPlaceholders/);
});
