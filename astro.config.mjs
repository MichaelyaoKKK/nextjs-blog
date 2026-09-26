import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://MichaelyaoKKK.github.io',
  base: process.env.GITHUB_PAGES === 'true' ? '/nextjs-blog' : '/'
});
