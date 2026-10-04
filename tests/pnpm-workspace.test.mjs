import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('Cloudflare pnpm 10 can discover the root package', async () => {
  const workspace = await readFile(new URL('../pnpm-workspace.yaml', import.meta.url), 'utf8');
  assert.match(workspace, /^packages:\s*\n\s+- ["']?\.["']?\s*$/m);
  assert.match(workspace, /^allowBuilds:\s*$/m);
  assert.match(workspace, /^\s+esbuild: true\s*$/m);
});
