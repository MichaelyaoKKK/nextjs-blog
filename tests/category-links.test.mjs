import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { categoryTargets } from '../src/lib/category-links.mjs';

const source = await readFile(new URL('../src/components/PortfolioPage.astro', import.meta.url), 'utf8');

test('category tags target the first card in each localized category', () => {
  const works = [
    { slug: 'portrait', category: '人物' },
    { slug: 'puppy', category: '动物' },
    { slug: 'second-portrait', category: '人物' },
    { slug: 'comic', category: '漫画' },
    { slug: 'dream', category: '想象力' }
  ];
  const targets = categoryTargets(works);
  assert.deepEqual([...targets], [
    ['人物', 'work-portrait'],
    ['动物', 'work-puppy'],
    ['漫画', 'work-comic'],
    ['想象力', 'work-dream']
  ]);
  assert.equal(categoryTargets([{ slug: 'portrait', category: 'People' }]).get('People'), 'work-portrait');
});

test('about tags link to card anchors and retain a non-link for unmatched tags', () => {
  assert.match(source, /const workCategoryTargets = categoryTargets\(displayedWorks\)/);
  assert.match(source, /page\.aboutTags\.map\(\(tag, index\) => workCategoryTargets\.has\(tag\)/);
  assert.match(source, /href=\{`#\$\{workCategoryTargets\.get\(tag\)\}`\}/);
  assert.match(source, /<article id=\{workCategoryTargets\.get\(work\.category\) === `work-\$\{work\.slug\}`/);
  assert.match(source, /: <span class:list=/);
});
