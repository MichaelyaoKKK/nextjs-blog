export function withBasePath(base, path) {
  const basePrefix = base.replace(/\/$/, '');
  const relativePath = path.replace(/^\/+/, '');
  return `${basePrefix}/${relativePath}`;
}
