/** Slug + lookup helpers for celebrity routes */

export const CATEGORY_SPOTLIGHT = {
  Actors:            ['Leonardo DiCaprio', 'Brad Pitt', 'Johnny Depp', 'Keanu Reeves', 'Zendaya', 'Margot Robbie', 'Tom Cruise'],
  Musicians:         ['Beyoncé', 'Taylor Swift', 'Rihanna', 'Drake', 'Adele', 'Ed Sheeran'],
  Athletes:          ['Cristiano Ronaldo', 'LeBron James', 'Serena Williams', 'Dwayne Johnson', 'Lionel Messi'],
  Directors:         ['Christopher Nolan', 'Steven Spielberg', 'Quentin Tarantino', 'Greta Gerwig'],
  Comedians:         ['Kevin Hart', 'Dave Chappelle', 'Ellen DeGeneres', 'Trevor Noah'],
  Models:            ['Gigi Hadid', 'Kendall Jenner', 'Naomi Campbell', 'Bella Hadid'],
  Creators:          ['MrBeast', 'Charli D\'Amelio', 'PewDiePie', 'Emma Chamberlain'],
  'Movie Producers': ['Steven Spielberg', 'George Lucas', 'Kathleen Kennedy', 'Jerry Bruckheimer'],
};

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

/** Shared img attrs — Wikimedia blocks hotlinks without no-referrer */
export const CELEB_IMG_PROPS = {
  referrerPolicy: 'no-referrer',
  loading: 'lazy',
  decoding: 'async',
};

/** Request higher-res image URLs (Wikipedia thumbs, Unsplash, etc.) */
export function enhanceImageUrl(url, px = 480) {
  if (!url || typeof url !== 'string') return url;
  if (url.includes('ui-avatars.com')) return url;

  url = url.replace(/^http:\/\//i, 'https://');

  if (url.includes('unsplash.com')) {
    let next = url.replace(/w=\d+/g, `w=${px}`).replace(/h=\d+/g, `h=${px}`);
    if (!/w=\d+/.test(next)) {
      next += `${next.includes('?') ? '&' : '?'}w=${px}&h=${px}&fit=crop&q=90`;
    }
    return next;
  }

  // Never upscale Wikimedia thumbs — larger px paths often 404 in the browser
  if (url.includes('wikimedia.org') && url.includes('/thumb/') && /\/\d+px-/.test(url)) {
    const match = url.match(/\/(\d+)px-/);
    if (match) {
      const current = parseInt(match[1], 10);
      if (px < current) return url.replace(/\/(\d+)px-/, `/${px}px-`);
    }
    return url;
  }

  return url;
}

export function celebDisplayImage(celeb, px = 480) {
  const url = celeb?.image;
  if (!url || url.includes('ui-avatars.com')) return url || null;
  return enhanceImageUrl(url, px);
}

export function isRealCelebPhoto(url) {
  return !!url && !url.includes('ui-avatars.com');
}

/** Pick a recognizable celebrity with a good photo for category rings */
export function pickCategoryCeleb(celebList, def) {
  const all = celebList?.length ? celebList : [];
  const spotlight = CATEGORY_SPOTLIGHT[def.label] || [];

  for (const name of spotlight) {
    const found = all.find(c => c.name?.toLowerCase().includes(name.toLowerCase()));
    if (found && isRealCelebPhoto(found.image)) return found;
  }

  const matches = all.filter(c =>
    c.category?.toLowerCase().includes(def.match.toLowerCase())
  );

  return (
    matches.find(c => isRealCelebPhoto(c.image) && c.verified) ||
    matches.find(c => isRealCelebPhoto(c.image)) ||
    matches.find(c => c.image) ||
    matches[0] ||
    null
  );
}
