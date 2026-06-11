// useMeta — sets document title + OG/Twitter meta tags dynamically per page
import { useEffect } from 'react';

const BASE = 'Starmeet';
const DEFAULT_DESC = 'Message your favourite celebrities directly. DM actors, musicians and athletes and get real replies.';
const DEFAULT_IMG  = 'https://starmeet.app/og-image.jpg';

export function useMeta({ title, description, image, url } = {}) {
  useEffect(() => {
    const fullTitle = title ? `${title} — ${BASE}` : `${BASE} — Message Your Favourite Celebrities`;
    const desc = description || DEFAULT_DESC;
    const img  = image || DEFAULT_IMG;
    const pageUrl = url || window.location.href;

    // Title
    document.title = fullTitle;

    // Helpers
    const setMeta = (selector, content) => {
      let el = document.querySelector(selector);
      if (!el) {
        el = document.createElement('meta');
        const attr = selector.includes('property=') ? 'property' : 'name';
        const val  = selector.match(/["']([^"']+)["']/)?.[1] || '';
        el.setAttribute(attr, val);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    setMeta('meta[name="description"]',          desc);
    setMeta('meta[property="og:title"]',         fullTitle);
    setMeta('meta[property="og:description"]',   desc);
    setMeta('meta[property="og:image"]',         img);
    setMeta('meta[property="og:url"]',           pageUrl);
    setMeta('meta[name="twitter:title"]',        fullTitle);
    setMeta('meta[name="twitter:description"]',  desc);
    setMeta('meta[name="twitter:image"]',        img);

    return () => {
      // Reset to defaults on unmount
      document.title = `${BASE} — Message Your Favourite Celebrities`;
    };
  }, [title, description, image, url]);
}
