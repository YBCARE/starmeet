/**
 * useCelebrities — fetches, enriches, and caches up to 2000 real celebrities
 * from Wikipedia API (+ Open Library for authors/creators).
 *
 * Strategy
 * ────────
 * 1. Check localStorage (24-hr TTL). If valid → return immediately.
 * 2. Batch-fetch seed celebrities (180 curated names) first → fast first paint.
 * 3. In parallel, query Wikipedia category-members for each WIKI_CATEGORIES entry.
 * 4. Deduplicate across seeds + discovered members.
 * 5. Batch-fetch page details (50 titles / request) with 150 ms pauses.
 * 6. Supplement with Open Library author data.
 * 7. Cache final set in localStorage.
 */

import { useState, useEffect, useCallback } from 'react';
import { filterCelebrityCatalog, DECEASED_CELEBRITY_NAMES, SYNTHETIC_CELEBRITY_NAMES } from '../utils/celebrityFilters';
import {
  SEED_CELEBRITIES,
  WIKI_CATEGORIES,
  fetchCategoryMembers,
  fetchPageDetails,
  fetchOpenLibraryAuthors,
  buildCelebrity,
} from '../services/wikiService';

const LIVE_SEEDS = SEED_CELEBRITIES.filter(
  ([name]) => !DECEASED_CELEBRITY_NAMES.has(name) && !SYNTHETIC_CELEBRITY_NAMES.has(name)
);

const CACHE_KEY     = 'starmeet_v5_celebrities';
const CACHE_TTL_MS  = 24 * 60 * 60 * 1000; // 24 h
const BATCH_SIZE    = 50;   // Wikipedia allows 50 titles per query
const INTER_BATCH_MS = 150; // polite delay between requests

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function delay(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ─── Hook ─────────────────────────────────────────────────────────────────
export function useCelebrities() {
  const [celebrities, setCelebrities]   = useState([]);
  const [loading, setLoading]           = useState(true);
  const [phase, setPhase]               = useState('init');   // 'init' | 'seeds' | 'discovering' | 'enriching' | 'done'
  const [fetched, setFetched]           = useState(0);        // how many have photos
  const [discovered, setDiscovered]     = useState(0);        // how many names found

  const addBatch = useCallback((newItems) => {
    const live = filterCelebrityCatalog(newItems);
    if (!live.length) return;
    setCelebrities(prev => {
      const existingIds = new Set(prev.map(c => c.id));
      const fresh = live.filter(c => !existingIds.has(c.id));
      return [...prev, ...fresh];
    });
    setFetched(n => n + live.length);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        localStorage.removeItem('starmeet_v3_celebrities');
        localStorage.removeItem('starmeet_v4_celebrities');
      } catch { /* ignore */ }

      // ── 1. Cache check ─────────────────────────────────────────────────
      try {
        const raw = localStorage.getItem(CACHE_KEY);
        if (raw) {
          const { data, ts } = JSON.parse(raw);
          const live = filterCelebrityCatalog(data);
          if (Date.now() - ts < CACHE_TTL_MS && live.length > 200) {
            setCelebrities(live);
            setFetched(live.length);
            setLoading(false);
            setPhase('done');
            return;
          }
        }
      } catch { /* corrupt cache — ignore */ }

      // ── 2. Seed celebrities (immediate) ────────────────────────────────
      setPhase('seeds');
      const seedBatches = chunk(LIVE_SEEDS, BATCH_SIZE);
      const seedResults = [];
      const seenNames   = new Set();

      for (const batch of seedBatches) {
        if (cancelled) return;
        const titles    = batch.map(([name]) => name);
        const catMap    = Object.fromEntries(batch);
        const details   = await fetchPageDetails(titles);

        const celebs = filterCelebrityCatalog(
          details
            .filter(d => !seenNames.has(d.name))
            .map(d => {
              seenNames.add(d.name);
              return buildCelebrity(d, catMap[d.name] || 'Actor');
            })
        );

        seedResults.push(...celebs);
        addBatch(celebs);
        await delay(INTER_BATCH_MS);
      }

      if (cancelled) return;

      // ── 3. Discover more via Wikipedia categories ──────────────────────
      setPhase('discovering');
      const discovered = []; // { title, category }

      // Run category fetches in small parallel groups
      const catGroups = chunk(WIKI_CATEGORIES, 3);
      for (const group of catGroups) {
        if (cancelled) return;
        await Promise.all(
          group.map(async ({ cat, label, cap }) => {
            const titles = await fetchCategoryMembers(cat, cap);
            for (const title of titles) {
              if (!seenNames.has(title)) {
                discovered.push({ title, category: label });
              }
            }
          })
        );
        setDiscovered(d => d + group.reduce((s, g) => s + g.cap, 0));
      }

      if (cancelled) return;

      // ── 4. Enrich discovered celebrities ──────────────────────────────
      setPhase('enriching');
      const titleBatches = chunk(discovered, BATCH_SIZE);
      const allResults   = [...seedResults];

      for (let i = 0; i < titleBatches.length; i++) {
        if (cancelled) return;

        const batch      = titleBatches[i];
        const catMapDisc = Object.fromEntries(batch.map(b => [b.title, b.category]));
        const details    = await fetchPageDetails(batch.map(b => b.title));

        const celebs = filterCelebrityCatalog(
          details
            .filter(d => !seenNames.has(d.name))
            .map(d => {
              seenNames.add(d.name);
              return buildCelebrity(d, catMapDisc[d.name] || 'Actor');
            })
        );

        allResults.push(...celebs);
        addBatch(celebs);

        // Stop at 2000
        if (allResults.length >= 2000) break;

        await delay(INTER_BATCH_MS);
      }

      if (cancelled) return;

      // ── 5. Open Library authors as Creators ───────────────────────────
      const authorQueries = [
        'science fiction author', 'bestseller novelist', 'fantasy author',
        'thriller writer', 'biography writer', 'memoir author',
      ];
      const olAuthors = await fetchOpenLibraryAuthors(authorQueries);
      const olCelebs  = filterCelebrityCatalog(
        olAuthors
          .filter(a => !seenNames.has(a.name))
          .map(a => {
            seenNames.add(a.name);
            return buildCelebrity(a, 'Creator');
          })
      );

      allResults.push(...olCelebs);
      if (olCelebs.length) addBatch(olCelebs);

      if (cancelled) return;

      // ── 6. Cache ───────────────────────────────────────────────────────
      const final = filterCelebrityCatalog(allResults).slice(0, 2000);
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ data: final, ts: Date.now() }));
      } catch { /* storage full — skip */ }

      setFetched(final.length);
      setCelebrities(final);
      setLoading(false);
      setPhase('done');
    }

    run();
    return () => { cancelled = true; };
  }, [addBatch]);

  return { celebrities, loading, phase, fetched };
}
