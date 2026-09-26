import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');
const [page, css, tailwind, postcss, placeholder, packageJson] = await Promise.all([
  read('../src/components/PortfolioPage.astro'),
  read('../src/styles/global.css'),
  read('../tailwind.config.cjs'),
  read('../postcss.config.cjs'),
  read('../public/images/artwork-placeholder.svg'),
  read('../package.json').then(JSON.parse)
]);

test('production styles and fonts are bundled rather than loaded from CDNs', () => {
  assert.doesNotMatch(page, /cdn\.tailwindcss\.com|fonts\.googleapis\.com|fonts\.gstatic\.com/);
  assert.match(page, /import '\.\.\/styles\/global\.css'/);
  assert.match(page, /@fontsource\/cabin-sketch\/400\.css/);
  assert.match(page, /@fontsource-variable\/noto-sans-sc/);
  assert.match(css, /@tailwind base;[\s\S]*@tailwind components;[\s\S]*@tailwind utilities;/);
  assert.match(tailwind, /darkMode: 'class'/);
  assert.match(tailwind, /display: \['Cabin Sketch', 'Noto Sans SC Variable', 'sans-serif'\]/);
  assert.match(postcss, /tailwindcss: \{\}/);
  for (const dependency of ['tailwindcss', 'postcss', 'autoprefixer', '@fontsource/cabin-sketch', '@fontsource-variable/noto-sans-sc']) {
    assert.ok(packageJson.devDependencies[dependency], `${dependency} must be installed for the build`);
  }
});

test('missing artwork uses a local base-aware neutral placeholder', () => {
  assert.doesNotMatch(page, /picsum\.photos/);
  assert.match(page, /withBasePath\(base, '\/images\/artwork-placeholder\.svg'\)/);
  assert.match(page, /work\.image \? withBasePath\(base, work\.image\) : placeholderImage/);
  assert.match(page, /project\.image \? withBasePath\(base, project\.image\) : placeholderImage/);
  assert.match(placeholder, /<svg\b/);
});
