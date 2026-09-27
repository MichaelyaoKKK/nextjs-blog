const imagePathPattern = /^\/images\/[a-zA-Z0-9][a-zA-Z0-9._/-]*\.(?:jpe?g|png|webp)$/i;
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** @returns {string[]} */
export function galleryImages(entry) {
  return Array.isArray(entry.gallery) ? entry.gallery : [];
}

export function coverImage(entry) {
  return entry.image || galleryImages(entry)[0] || '';
}

export function albumPath(locale, collection, slug) {
  const languagePrefix = locale === 'zh' ? '' : `/${locale}`;
  return `${languagePrefix}/${collection}/${slug}/`;
}

export function validateAlbumEntries(entries, collection) {
  const seenSlugs = new Set();

  for (const entry of entries) {
    if (!slugPattern.test(entry.slug || '') || seenSlugs.has(entry.slug)) {
      throw new Error(`${collection}: each album needs a unique lowercase slug (${entry.slug || 'missing'}).`);
    }
    seenSlugs.add(entry.slug);

    if (entry.gallery != null && !Array.isArray(entry.gallery)) {
      throw new Error(`${collection}/${entry.slug}: gallery must be a list of local image paths.`);
    }
    const images = galleryImages(entry);
    if (images.some((path) => typeof path !== 'string' || !imagePathPattern.test(path) || path.split('/').includes('..'))) {
      throw new Error(`${collection}/${entry.slug}: gallery must be a list of local image paths.`);
    }
    if (new Set(images).size !== images.length) {
      throw new Error(`${collection}/${entry.slug}: gallery contains duplicate images.`);
    }
    if (entry.image && !images.includes(entry.image)) {
      throw new Error(`${collection}/${entry.slug}: cover image must also be in the gallery.`);
    }
  }
}
