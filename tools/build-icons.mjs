// Draws the goose and renders the app icons.  Run: npm run icons
import { writeFileSync } from 'node:fs';
import { Resvg } from '@resvg/resvg-js';

const INK = '#3A2E2A';
const ORANGE = '#F2A03D';
const SCARF = '#8DB3C7';

// The goose, in a 512×512 frame. Kept inside the central 80% circle so
// Android's round "maskable" crop never clips it.
const goose = `
  <defs>
    <filter id="rough" x="-10%" y="-10%" width="120%" height="120%">
      <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="1" seed="7" result="n"/>
      <feDisplacementMap in="SourceGraphic" in2="n" scale="3.5" xChannelSelector="R" yChannelSelector="G"/>
    </filter>
    <clipPath id="bodyClip"><path id="bodyPath" d="M196 290 C150 318 152 404 248 414 L338 414 C408 410 440 364 436 312 C448 296 460 272 456 254 C432 270 404 270 382 266 C330 258 252 262 196 290 Z"/></clipPath>
  </defs>
  <ellipse cx="290" cy="424" rx="150" ry="15" fill="#000" opacity=".07"/>
  <g filter="url(#rough)" stroke-linejoin="round" stroke-linecap="round">
    <!-- feet, tucked under -->
    <g fill="${ORANGE}" stroke="${INK}" stroke-width="7">
      <ellipse cx="262" cy="418" rx="27" ry="11"/>
      <ellipse cx="322" cy="420" rx="27" ry="11"/>
    </g>
    <!-- silhouette: outline pass, then fill pass, so head/neck/body read as one shape -->
    <g stroke="${INK}" stroke-width="15" fill="${INK}">
      <circle cx="200" cy="150" r="50"/>
      <path d="M164 176 C152 226 152 272 200 306 L272 292 C236 266 226 226 240 176 Z"/>
      <use href="#bodyPath"/>
    </g>
    <g fill="#FFFDF8">
      <circle cx="200" cy="150" r="50"/>
      <path d="M164 176 C152 226 152 272 200 306 L272 292 C236 266 226 226 240 176 Z"/>
      <use href="#bodyPath"/>
    </g>
    <!-- soft belly shading -->
    <g clip-path="url(#bodyClip)" fill="#EDE6DB" opacity=".7">
      <ellipse cx="320" cy="438" rx="150" ry="44"/>
    </g>
    <!-- wing -->
    <path d="M268 302 C318 282 398 288 414 322 C400 364 334 380 286 364 C304 346 292 320 268 302 Z"
          fill="#F1EBE1" stroke="${INK}" stroke-width="6"/>
    <path d="M326 346 C350 346 376 338 394 326 M314 362 C342 363 368 357 386 346" fill="none" stroke="${INK}" stroke-width="4.5" opacity=".75"/>
    <!-- scarf -->
    <path d="M160 250 C190 266 226 266 252 252 L260 278 C230 292 194 292 164 276 Z" fill="${SCARF}" stroke="${INK}" stroke-width="6"/>
    <path d="M176 272 C166 292 160 308 150 324 L176 322 C180 304 186 290 190 276 Z" fill="${SCARF}" stroke="${INK}" stroke-width="6"/>
    <circle cx="179" cy="271" r="11" fill="${SCARF}" stroke="${INK}" stroke-width="6"/>
    <!-- beak -->
    <path d="M160 138 C128 134 108 145 100 158 C116 171 146 171 164 164 Z" fill="${ORANGE}" stroke="${INK}" stroke-width="7"/>
    <path d="M106 158 C124 161 144 160 160 156" fill="none" stroke="${INK}" stroke-width="4"/>
  </g>
  <!-- face, unroughened so it stays crisp when tiny -->
  <ellipse cx="213" cy="165" rx="15" ry="10" fill="#EE9FAE" opacity=".8"/>
  <circle cx="190" cy="134" r="9" fill="${INK}"/>
  <circle cx="193" cy="130.5" r="3" fill="#fff"/>
`;

const sparkle = (x, y, s, fill) =>
  `<path transform="translate(${x} ${y}) scale(${s})" fill="${fill}" d="M0,-34 C3,-7 7,-3 22,0 C7,3 3,7 0,34 C-3,7 -7,3 -22,0 C-7,-3 -3,-7 0,-34 Z"/>`;

const grain = `
  <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="2"/><feColorMatrix type="saturate" values="0"/></filter>
  <rect width="512" height="512" filter="url(#grain)" opacity=".06"/>`;

const icon = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#CFE2EB"/>
  <path d="M96 512 V262 A160 160 0 0 1 416 262 V512 Z" fill="#EEF5F8"/>
  ${sparkle(392, 128, 0.62, INK)}
  ${sparkle(122, 236, 0.32, INK)}
  ${goose}
  ${grain}
</svg>`;

// Transparent version for the in-app home screen.
const art = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="90 90 380 345">
  ${goose}
</svg>`;

writeFileSync('icons/icon.svg', icon);
writeFileSync('icons/goose.svg', art);

const render = (svg, size, file) => {
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: size } }).render().asPng();
  writeFileSync(file, png);
};
render(icon, 512, 'icons/icon-512.png');
render(icon, 192, 'icons/icon-192.png');
render(icon, 180, 'icons/apple-touch-icon.png');
render(icon, 32, 'icons/favicon-32.png');
console.log('icons written');
