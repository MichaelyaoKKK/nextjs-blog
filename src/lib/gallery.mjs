const imagePathPattern = /^\/images\/[^\\?#\x00-\x1F]+\.(?:jpe?g|png|webp)$/i;
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** @returns {{ image: string, title: string }[]} */
export function galleryPhotos(entry) {
  return Array.isArray(entry.gallery) ? entry.gallery : [];
}

/** @returns {string[]} */
export function galleryImages(entry) {
  return galleryPhotos(entry).map((photo) => photo.image);
}

export function coverImage(entry) {
  const images = galleryImages(entry);
  return images.includes(entry.image) ? entry.image : images[0] || '';
}

export function coverPhoto(entry) {
  const image = coverImage(entry);
  return galleryPhotos(entry).find((photo) => photo.image === image);
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
      throw new Error(`${collection}/${entry.slug}: gallery must be a list of named photos.`);
    }
    const photos = galleryPhotos(entry);
    if (photos.some((photo) => !photo || typeof photo !== 'object' || Array.isArray(photo) || typeof photo.image !== 'string' || !imagePathPattern.test(photo.image) || photo.image.slice('/images/'.length).split('/').some((part) => !part || part === '.' || part === '..'))) {
      throw new Error(`${collection}/${entry.slug}: gallery must contain local image paths.`);
    }
    if (photos.some((photo) => typeof photo.title !== 'string' || !photo.title.trim() || /\.(?:jpe?g|png|webp)$/i.test(photo.title.trim()))) {
      throw new Error(`${collection}/${entry.slug}: every photo needs a name without a file extension.`);
    }
    const images = galleryImages(entry);
    if (new Set(images).size !== images.length) {
      throw new Error(`${collection}/${entry.slug}: gallery contains duplicate images.`);
    }
  }
}
