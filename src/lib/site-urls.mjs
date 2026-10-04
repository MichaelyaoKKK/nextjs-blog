export const siteOrigin = 'https://alisayao.com';

export function withBasePath(base, path) {
  const basePrefix = base.replace(/\/$/, '');
  const relativePath = path.replace(/^\/+/, '');
  return `${basePrefix}/${relativePath}`;
}

export function canonicalSiteUrl(path) {
  return new URL(path, siteOrigin).href;
}
