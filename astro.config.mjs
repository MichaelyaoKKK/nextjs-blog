import { defineConfig } from 'astro/config';
import { siteOrigin } from './src/lib/site-urls.mjs';

export default defineConfig({
  site: siteOrigin,
  base: process.env.GITHUB_PAGES === 'true' ? '/nextjs-blog' : '/'
});
