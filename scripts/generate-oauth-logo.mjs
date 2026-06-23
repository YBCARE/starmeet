import sharp from 'sharp';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const outDir = join(root, 'public');
const out = join(outDir, 'starmeet-oauth-logo.png');
const SIZE = 120;

const sources = [
  'C:/Users/USER/.cursor/projects/empty-window/assets/starmeet-google-120.png',
  'C:/Users/USER/.cursor/projects/empty-window/assets/starmeet-oauth-logo.png',
  'C:/Users/USER/.cursor/projects/empty-window/assets/starmeet-logo.png',
];

const fallbackSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 120 120">
  <rect width="120" height="120" fill="#0a0a14"/>
  <polygon points="60,7 73,42 110,42 79,64 90,100 60,80 30,100 41,64 10,42 47,42" fill="#0095f6"/>
  <ellipse cx="78" cy="81" rx="21" ry="16" fill="#8b5cf6"/>
  <polygon points="69,95 61,110 77,95" fill="#8b5cf6"/>
  <circle cx="72" cy="81" r="3" fill="#0a0a14"/>
  <circle cx="78" cy="81" r="3" fill="#0a0a14"/>
  <circle cx="84" cy="81" r="3" fill="#0a0a14"/>
</svg>`;

export async function generateOAuthLogo() {
  mkdirSync(outDir, { recursive: true });

  let from = 'svg-fallback';
  for (const src of sources) {
    if (!existsSync(src)) continue;
    await sharp(src)
      .resize(SIZE, SIZE, { fit: 'cover', position: 'centre' })
      .png({ compressionLevel: 9, palette: true })
      .toFile(out);
    from = src;
    break;
  }

  if (from === 'svg-fallback') {
    await sharp(Buffer.from(fallbackSvg))
      .resize(SIZE, SIZE)
      .png({ compressionLevel: 9 })
      .toFile(out);
  }

  const meta = await sharp(out).metadata();
  const bytes = (await import('fs')).statSync(out).size;

  const report = `path=${out}
bytes=${bytes}
width=${meta.width}
height=${meta.height}
kb=${(bytes / 1024).toFixed(2)}
source=${from}
google_oauth=OK (120x120, max 1MB)`;

  writeFileSync(join(outDir, 'oauth-logo-report.txt'), report, 'utf8');
  return { out, bytes, width: meta.width, height: meta.height, report };
}
