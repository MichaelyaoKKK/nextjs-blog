import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const readConfig = (enabled) => JSON.parse(execFileSync(process.execPath, [
  '--input-type=module',
  '-e',
  "import config from './astro.config.mjs'; console.log(JSON.stringify({ site: config.site, base: config.base }));"
], {
  cwd: root,
  env: { ...process.env, GITHUB_PAGES: enabled ? 'true' : 'false' },
  encoding: 'utf8'
}));

test('local preview keeps root URLs', () => {
  assert.equal(readConfig(false).base, '/');
});

test('GitHub Pages build uses the repository path', () => {
  assert.deepEqual(readConfig(true), {
    site: 'https://MichaelyaoKKK.github.io',
    base: '/nextjs-blog'
  });
});
