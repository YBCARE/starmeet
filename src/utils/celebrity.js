/** Slug + lookup helpers for celebrity routes */
export function slugify(name = '') {
  return String(name)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function findCelebrity(celebrities, idOrSlug) {
  if (!idOrSlug || !celebrities?.length) return null;
  const raw = decodeURIComponent(String(idOrSlug)).trim();
  const byId = celebrities.find(c => String(c.id) === raw);
  if (byId) return byId;
  const slug = raw.toLowerCase();
  const bySlug = celebrities.find(c => slugify(c.name) === slug);
  if (bySlug) return bySlug;
  return celebrities.find(c => {
    const s = slugify(c.name);
    return s.includes(slug) || slug.includes(s);
  }) || null;
}

export function celebPath(celeb) {
  if (!celeb) return '/explore';
  return `/celebrity/${slugify(celeb.name)}`;
}
