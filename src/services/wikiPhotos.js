// ─── One-time cache purge — remove all old photo cache versions ───────────────
try {
  Object.keys(localStorage)
    .filter(k => /sm_celeb_photos_v[1-6]_/.test(k))
    .forEach(k => localStorage.removeItem(k));
} catch {}

// ─── Shared ───────────────────────────────────────────────────────────────────
const TTL = 72 * 60 * 60 * 1000;

/** Stable identity for one image file (ignores thumbnail size / URL variants) */
export function photoIdentity(url) {
  if (!url) return '';
  try {
    const u = String(url).toLowerCase().split('?')[0];
    const m = u.match(/\/([^/]+\.(?:jpe?g|png|webp))(?:\/\d+px-\1)?$/i);
    if (m) return m[1].replace(/^\d+px-/, '');
    const part = u.split('/').pop() || '';
    return part.replace(/^\d+px-/, '');
  } catch {
    return String(url);
  }
}

export function dedupePhotoUrls(urls) {
  if (!Array.isArray(urls)) return [];
  const seen = new Set();
  const out = [];
  for (const url of urls) {
    if (!url) continue;
    const key = photoIdentity(url);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(url);
  }
  return out;
}

// Extract the base filename from any Wikipedia thumbnail URL
function baseFilename(url) {
  return photoIdentity(url);
}

// Add a URL to a set, deduplicating by stable file identity
function addUnique(url, seenKeys, out) {
  if (!url) return;
  const key = photoIdentity(url);
  if (seenKeys.has(key)) return;
  seenKeys.add(key);
  out.push(url);
}

// ─── Wikipedia bio ────────────────────────────────────────────────────────────
const BIO_PREFIX = 'sm_celeb_bio_v1_';

export async function fetchCelebBio(title) {
  const cacheKey = BIO_PREFIX + title;
  try {
    const cached = JSON.parse(localStorage.getItem(cacheKey));
    if (cached && Date.now() - cached.ts < TTL) return cached.bio;
  } catch {}

  try {
    const url =
      `https://en.wikipedia.org/w/api.php?action=query` +
      `&titles=${encodeURIComponent(title)}` +
      `&prop=extracts&exintro=true&explaintext=true` +
      `&format=json&origin=*`;
    const res  = await fetch(url);
    const data = await res.json();
    const page = Object.values(data?.query?.pages || {})[0];
    const raw  = page?.extract || '';
    const bio  = raw
      .replace(/={2,}[^=]+=={2,}/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
      .slice(0, 2500);
    if (bio) {
      try { localStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), bio })); } catch {}
    }
    return bio || null;
  } catch { return null; }
}

// ─── Celebrity photos ─────────────────────────────────────────────────────────
const CACHE_PREFIX = 'sm_celeb_photos_v7_';

const REJECT = /flag|logo|icon|seal|coat_of|map|badge|poster|album|cover|signature|stamp|award|trophy|medal|wiki|commons|banner|landscape|scenery|building|street|crowd|concert|stage|premiere|red.?carpet|carpet|couple|wedding|family|child|baby|childhood|birth|grave|cemetery|monument|statue|plaque|mural|painting|artwork|star_on|walk_of_fame|hollywood_bowl|handprint|infobox|thumb|default|placeholder|no.?image|missing/i;

async function resolveUrls(filenames, size = 600) {
  if (!filenames.length) return [];
  const all = [];
  const chunks = [];
  for (let i = 0; i < filenames.length; i += 20) chunks.push(filenames.slice(i, i + 20));
  for (const chunk of chunks) {
    try {
      const url =
        `https://en.wikipedia.org/w/api.php?action=query` +
        `&titles=${chunk.map(encodeURIComponent).join('|')}` +
        `&prop=imageinfo&iiprop=url|dimensions&iiurlwidth=${size}` +
        `&format=json&origin=*`;
      const res  = await fetch(url);
      const data = await res.json();
      Object.values(data?.query?.pages || {}).forEach(p => {
        const info = p?.imageinfo?.[0];
        if (!info?.thumburl) return;
        if (info.width && info.height && info.width > info.height * 1.35) return;
        all.push(info.thumburl);
      });
    } catch {}
  }
  return all;
}

export async function fetchCelebPhotos(title, count = 20) {
  const cacheKey = CACHE_PREFIX + title;

  // ── Read from cache — NO cycling, return only what we have ────────────────
  try {
    const cached = JSON.parse(localStorage.getItem(cacheKey));
    if (cached && Date.now() - cached.ts < TTL && cached.photos?.length > 0) {
      const clean = dedupePhotoUrls(cached.photos);
      if (clean.length !== cached.photos.length) {
        try { localStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), photos: clean })); } catch {}
      }
      return clean.slice(0, count);
    }
  } catch {}

  const parts = title.toLowerCase().split(' ').filter(p => p.length > 2);

  // ── 1. Main thumbnail ────────────────────────────────────────────────────
  let mainThumb = null;
  try {
    const res  = await fetch(`https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=pageimages&pithumbsize=600&format=json&origin=*`);
    const data = await res.json();
    const page = Object.values(data?.query?.pages || {})[0];
    mainThumb  = page?.thumbnail?.source || null;
  } catch {}

  // ── 2. Full image list ───────────────────────────────────────────────────
  let allFiles = [];
  try {
    const res  = await fetch(`https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=images&imlimit=50&format=json&origin=*`);
    const data = await res.json();
    const page = Object.values(data?.query?.pages || {})[0];
    allFiles   = (page?.images || []).map(img => img.title);
  } catch {}

  // ── 3. Strict filter: filename must contain celeb's own name ─────────────
  const strictFiles = allFiles.filter(t => {
    if (!/\.(jpg|jpeg|png)$/i.test(t)) return false;
    if (REJECT.test(t)) return false;
    const lower = t.toLowerCase();
    return parts.some(part => lower.includes(part));
  });

  // ── 4. Loose filter: any portrait-safe image on their page ───────────────
  const looseFiles = allFiles.filter(t => {
    if (!/\.(jpg|jpeg|png)$/i.test(t)) return false;
    if (REJECT.test(t)) return false;
    return !strictFiles.includes(t);
  });

  // ── 5. Resolve to URLs ───────────────────────────────────────────────────
  const strictUrls = await resolveUrls(strictFiles, 600);
  const looseUrls  = strictUrls.length < 5
    ? await resolveUrls(looseFiles.slice(0, 20), 600)
    : [];

  const seenKeys = new Set();
  const unique   = [];

  addUnique(mainThumb, seenKeys, unique);
  strictUrls.forEach(u => addUnique(u, seenKeys, unique));
  looseUrls.forEach(u  => addUnique(u, seenKeys, unique));

  const photos = dedupePhotoUrls(unique);

  // ── 7. Cache the clean unique list ───────────────────────────────────────
  try { localStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), photos })); } catch {}

  return photos.slice(0, count);
}
