// ─── One-time cache purge — remove all old photo cache versions ───────────────
try {
  Object.keys(localStorage)
    .filter(k => /sm_celeb_photos_v[1-5]_/.test(k))
    .forEach(k => localStorage.removeItem(k));
} catch {}

// ─── Shared ───────────────────────────────────────────────────────────────────
const TTL = 72 * 60 * 60 * 1000;

// Extract the base filename from any Wikipedia thumbnail URL
// e.g. ".../600px-Keanu_Reeves_2019.jpg" → "keanu_reeves_2019.jpg"
function baseFilename(url) {
  try {
    const part = url.split('/').pop() || '';
    // strip leading "NNNpx-" size prefix that Wikipedia adds
    return part.replace(/^\d+px-/, '').toLowerCase();
  } catch { return url; }
}

// Add a URL to a set, deduplicating by base filename AND full URL
function addUnique(url, seenNames, seenUrls, out) {
  if (!url) return;
  const name = baseFilename(url);
  if (seenUrls.has(url) || seenNames.has(name)) return;
  seenUrls.add(url);
  seenNames.add(name);
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
const CACHE_PREFIX = 'sm_celeb_photos_v6_';

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
      return cached.photos.slice(0, count); // never cycle
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

  // ── 6. Deduplicate by BOTH full URL AND base filename ────────────────────
  const seenUrls  = new Set();
  const seenNames = new Set();
  const unique    = [];

  addUnique(mainThumb, seenNames, seenUrls, unique);
  strictUrls.forEach(u => addUnique(u, seenNames, seenUrls, unique));
  looseUrls.forEach(u  => addUnique(u, seenNames, seenUrls, unique));

  // ── 7. Cache the clean unique list ───────────────────────────────────────
  try { localStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), photos: unique })); } catch {}

  return unique.slice(0, count); // never cycle
}
