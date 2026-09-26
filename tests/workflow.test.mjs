import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const workflow = await readFile(new URL('../.github/workflows/deploy.yml', import.meta.url), 'utf8');

test('main updates build, test, and deploy GitHub Pages', () => {
  assert.match(workflow, /push:\s+branches: \[main\]/);
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /contents: read/);
  assert.match(workflow, /pages: write/);
  assert.match(workflow, /id-token: write/);
  assert.match(workflow, /pnpm install --frozen-lockfile/);
  assert.match(workflow, /pnpm test/);
  assert.match(workflow, /pnpm run build\s+env:\s+GITHUB_PAGES: 'true'/);
  assert.match(workflow, /actions\/upload-pages-artifact@v4\s+with:\s+path: dist/);
  assert.match(workflow, /needs: build/);
  assert.match(workflow, /actions\/deploy-pages@v5/);
});
