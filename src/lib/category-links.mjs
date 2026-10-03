/** Link each category to its first visible work card. */
export function categoryTargets(works) {
  const targets = new Map();
  for (const work of works) {
    if (!targets.has(work.category)) targets.set(work.category, `work-${work.slug}`);
  }
  return targets;
}
