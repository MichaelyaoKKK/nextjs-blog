import { copyFile } from 'node:fs/promises';

for (const file of ['site.js', 'admin.html', 'admin.js']) {
  await copyFile(new URL(`../${file}`, import.meta.url), new URL(`../dist/${file}`, import.meta.url));
}
