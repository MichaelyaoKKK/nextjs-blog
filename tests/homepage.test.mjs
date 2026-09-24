import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';

const source = await readFile(new URL('../src/pages/index.astro', import.meta.url), 'utf8');
const config = await readFile(new URL('../.pages.yml', import.meta.url), 'utf8');
const page = JSON.parse(await readFile(new URL('../src/data/page.json', import.meta.url), 'utf8'));
const works = JSON.parse(await readFile(new URL('../src/data/works.json', import.meta.url), 'utf8'));
const daily = JSON.parse(await readFile(new URL('../src/data/daily.json', import.meta.url), 'utf8'));

test('Astro is the sole homepage source and reads editable content', async () => {
  await assert.rejects(stat(new URL('../index.html', import.meta.url)), { code: 'ENOENT' });
  for (const file of ['page', 'works', 'daily']) {
    assert.match(source, new RegExp(`import ${file} from '../data/${file}\\.json'`));
  }
  for (const id of ['about', 'works', 'daily', 'contact']) {
    assert.match(source, new RegExp(`id="${id}"`));
  }
  assert.match(source, /ScrollTrigger/);
  assert.doesNotMatch(source, /mailto:|<form\b/i);
});

test('homepage copy has corresponding Pages CMS fields', () => {
  for (const [key, value] of Object.entries(page)) {
    assert.match(config, new RegExp(`name: ${key}(?:,|\\s)`));
    assert.ok(source.includes(`page.${key}`), `${key} must appear in the homepage`);
    if (Array.isArray(value)) {
      assert.ok(value.every((item) => typeof item === 'string'));
    } else {
      assert.equal(typeof value, 'string');
    }
  }
  assert.match(config, /name: aboutTags, label: 关于我标签, type: string, list: true/);
  assert.match(source, /src=\{page\.heroImage \|\|/);
});

test('works and daily entries expose editable text and optional images', () => {
  assert.ok(works.length >= 4);
  assert.ok(daily.length >= 3);
  for (const [entries, fields] of [
    [works, ['title', 'category', 'note', 'image']],
    [daily, ['title', 'copy', 'image']]
  ]) {
    for (const entry of entries) {
      assert.deepEqual(Object.keys(entry).sort(), [...fields].sort());
      for (const field of fields.filter((name) => name !== 'image')) assert.ok(entry[field].trim());
      assert.match(entry.image, /^(?:|\/images\/.+)$/);
    }
  }
  assert.match(config, /path: src\/data\/works\.json\s+format: json\s+list: true/);
  assert.match(config, /path: src\/data\/daily\.json\s+format: json\s+list: true/);
  assert.match(config, /input: public\/images\s+output: \/images/);
  assert.match(source, /work\.image \|\| workPlaceholders/);
  assert.match(source, /project\.image \|\| dailyPlaceholders/);
});
