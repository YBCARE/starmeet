import { useState, useEffect, useMemo } from 'react';
import { celebDisplayImage, CELEB_IMG_PROPS } from '../utils/celebrity';

function avatarFallback(name, size = 400) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || '?')}&background=111&color=aaa&size=${size}`;
}

/**
 * Celebrity photo with Wikimedia-safe loading and fallback chain:
 * enhanced URL → raw Wikipedia URL → initials placeholder
 */
export default function CelebImage({
  celeb,
  src,
  alt,
  px = 440,
  name,
  className,
  style,
  ...rest
}) {
  const label = alt || celeb?.name || name || '';
  const fallback = useMemo(() => avatarFallback(label), [label]);

  const primary = src || (celeb ? celebDisplayImage(celeb, px) : null);
  const raw = celeb?.image && !celeb.image.includes('ui-avatars.com') ? celeb.image : null;
  const best = primary || raw || fallback;

  const [current, setCurrent] = useState(best);

  useEffect(() => {
    setCurrent(best);
  }, [best]);

  function handleError() {
    setCurrent(prev => {
      if (raw && prev !== raw) return raw;
      if (prev !== fallback) return fallback;
      return prev;
    });
  }

  return (
    <img
      {...CELEB_IMG_PROPS}
      src={current}
      alt={label}
      className={className}
      style={style}
      onError={handleError}
      {...rest}
    />
  );
}
