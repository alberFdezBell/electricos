const fs = require('fs');
const path = require('path');

const imgDir = path.join(__dirname, '../../public/images');
const uploadDir = path.join(__dirname, '../../public/uploads');

if (!fs.existsSync(imgDir)) fs.mkdirSync(imgDir, { recursive: true });
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// Minimal 1x1 transparent PNG fallback if needed, or SVG data
const electricosSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#FEF08A;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#EAB308;stop-opacity:1" />
    </linearGradient>
  </defs>
  <path d="M100 10 L170 40 L170 110 C170 150 100 190 100 190 C100 190 30 150 30 110 L30 40 Z" fill="url(#grad)" stroke="#1E293B" stroke-width="6"/>
  <polygon points="110,35 70,105 105,105 90,165 140,90 100,90" fill="#1E293B"/>
  <text x="100" y="180" font-family="sans-serif" font-weight="bold" font-size="14" text-anchor="middle" fill="#1E293B">ELÉCTRICOS FC</text>
</svg>`;

const placeholderFondoSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1E293B;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#0F172A;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="800" height="600" fill="url(#bgGrad)"/>
  <circle cx="400" cy="300" r="180" fill="none" stroke="#FEF08A" stroke-width="4" stroke-dasharray="10 10" opacity="0.3"/>
  <path d="M400 180 L440 250 L520 250 L455 295 L480 370 L400 325 L320 370 L345 295 L280 250 L360 250 Z" fill="#FEF08A" opacity="0.15"/>
</svg>`;

fs.writeFileSync(path.join(imgDir, 'electricos.png'), electricosSvg);
fs.writeFileSync(path.join(imgDir, 'placeholder-fondo.png'), placeholderFondoSvg);
fs.writeFileSync(path.join(imgDir, 'default-player.png'), electricosSvg);

console.log('Imágenes por defecto generadas correctamente.');
