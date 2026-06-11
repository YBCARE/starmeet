const sharp = require('sharp');
const { writeFileSync } = require('fs');
const { resolve } = require('path');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="textGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#a78bfa"/>
      <stop offset="100%" style="stop-color:#60a5fa"/>
    </linearGradient>
    <filter id="blur1">
      <feGaussianBlur stdDeviation="80"/>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="#000000"/>

  <!-- Glow blobs -->
  <ellipse cx="600" cy="180" rx="520" ry="260" fill="#7c3aed" opacity="0.13" filter="url(#blur1)"/>
  <ellipse cx="800" cy="420" rx="300" ry="180" fill="#3b82f6" opacity="0.09" filter="url(#blur1)"/>

  <!-- Top badge -->
  <rect x="450" y="118" width="300" height="36" rx="18" fill="#0d0d0d" stroke="#1f1f1f" stroke-width="1.5"/>
  <circle cx="476" cy="136" r="5.5" fill="#22c55e"/>
  <text x="494" y="141" font-family="Arial,sans-serif" font-size="14" font-weight="600" fill="#888888">1,300+ celebrities active now</text>

  <!-- Main headline -->
  <text x="600" y="238" font-family="Arial,sans-serif" font-size="84" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="-3">Your message.</text>
  <text x="600" y="336" font-family="Arial,sans-serif" font-size="84" font-weight="900" fill="url(#textGrad)" text-anchor="middle" letter-spacing="-3">Their reply.</text>

  <!-- Subtext -->
  <text x="600" y="402" font-family="Arial,sans-serif" font-size="23" fill="#555555" text-anchor="middle">DM your favourite celebrity. Get a real reply back.</text>

  <!-- Avatar stack -->
  <circle cx="476" cy="462" r="17" fill="#1e1b4b" stroke="#000" stroke-width="2.5"/>
  <text x="476" y="467" font-family="Arial" font-size="12" font-weight="700" fill="#818cf8" text-anchor="middle">K</text>
  <circle cx="494" cy="462" r="17" fill="#1a2e1a" stroke="#000" stroke-width="2.5"/>
  <text x="494" y="467" font-family="Arial" font-size="12" font-weight="700" fill="#4ade80" text-anchor="middle">A</text>
  <circle cx="512" cy="462" r="17" fill="#2e1a1a" stroke="#000" stroke-width="2.5"/>
  <text x="512" y="467" font-family="Arial" font-size="12" font-weight="700" fill="#f87171" text-anchor="middle">M</text>
  <circle cx="530" cy="462" r="17" fill="#1a1a2e" stroke="#000" stroke-width="2.5"/>
  <text x="530" y="467" font-family="Arial" font-size="12" font-weight="700" fill="#60a5fa" text-anchor="middle">J</text>
  <circle cx="548" cy="462" r="17" fill="#2a2510" stroke="#000" stroke-width="2.5"/>
  <text x="548" y="467" font-family="Arial" font-size="12" font-weight="700" fill="#fbbf24" text-anchor="middle">R</text>
  <text x="579" y="467" font-family="Arial,sans-serif" font-size="16" fill="#555555">
    <tspan font-weight="700" fill="#aaaaaa">500,000+</tspan> fans connected
  </text>

  <!-- CTA button -->
  <rect x="466" y="502" width="268" height="50" rx="25" fill="#ffffff"/>
  <text x="600" y="533" font-family="Arial,sans-serif" font-size="17" font-weight="800" fill="#000000" text-anchor="middle">Start for free  →</text>

  <!-- Domain -->
  <text x="600" y="601" font-family="Arial,sans-serif" font-size="16" font-weight="600" fill="#2a2a2a" text-anchor="middle" letter-spacing="1">starmeet.app</text>
</svg>`;

const jpgPath = resolve(__dirname, 'public/og-image.jpg');

sharp(Buffer.from(svg))
  .resize(1200, 630)
  .jpeg({ quality: 93 })
  .toFile(jpgPath)
  .then(() => console.log('✅  public/og-image.jpg created!'))
  .catch(err => console.error('❌', err.message));
