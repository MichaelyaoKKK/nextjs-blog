export function canZoomToOriginal(naturalWidth, naturalHeight, viewportWidth, viewportHeight) {
  if (naturalWidth <= 0 || naturalHeight <= 0) return false;
  return naturalWidth > viewportWidth || naturalHeight > viewportHeight;
}
