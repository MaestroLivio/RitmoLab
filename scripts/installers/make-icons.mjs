// scripts/installers/make-icons.mjs
// Genera il logo di RitmoLab (PNG 1024x1024 + ICO multi-risoluzione) senza
// dipendenze esterne: disegna in JS e codifica il PNG a mano con zlib.

import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

/* ------------------------------------------------------------------ PNG ---- */

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const t = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
  return Buffer.concat([len, t, data, crc]);
}

function encodePNG(w, h, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const stride = w * 4 + 1;
  const raw = Buffer.alloc(stride * h);
  for (let y = 0; y < h; y++) {
    raw[y * stride] = 0; // filtro "None"
    rgba.copy(raw, y * stride + 1, y * w * 4, (y + 1) * w * 4);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/* -------------------------------------------------------------- DISEGNO ---- */

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const mix = (a, b, t) => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];

const WHITE = [1, 1, 1];

function insideRoundRect(x, y, x0, y0, x1, y1, r) {
  if (x < x0 || x > x1 || y < y0 || y > y1) return false;
  const inCornerX = x < x0 + r || x > x1 - r;
  const inCornerY = y < y0 + r || y > y1 - r;
  if (inCornerX && inCornerY) {
    const cx = x < x0 + r ? x0 + r : x1 - r;
    const cy = y < y0 + r ? y0 + r : y1 - r;
    const dx = x - cx;
    const dy = y - cy;
    return dx * dx + dy * dy <= r * r;
  }
  return true;
}

function insideEllipse(x, y, cx, cy, rx, ry, ang) {
  const dx = x - cx;
  const dy = y - cy;
  const c = Math.cos(-ang);
  const s = Math.sin(-ang);
  const u = dx * c - dy * s;
  const v = dx * s + dy * c;
  return (u * u) / (rx * rx) + (v * v) / (ry * ry) <= 1;
}

function segDist(px, py, ax, ay, bx, by) {
  const vx = bx - ax;
  const vy = by - ay;
  const wx = px - ax;
  const wy = py - ay;
  const len2 = vx * vx + vy * vy;
  let t = len2 === 0 ? 0 : (wx * vx + wy * vy) / len2;
  t = t < 0 ? 0 : t > 1 ? 1 : t;
  const dx = px - (ax + vx * t);
  const dy = py - (ay + vy * t);
  return Math.sqrt(dx * dx + dy * dy);
}

// Pennello "a corda" lungo una curva di Bézier quadratica campionata.
const FLAG_P0 = [0.494, 0.276];
const FLAG_P1 = [0.632, 0.300];
const FLAG_P2 = [0.512, 0.452];
const FLAG_SAMPLES = (() => {
  const pts = [];
  for (let i = 0; i <= 24; i++) {
    const t = i / 24;
    const a = (1 - t) * (1 - t);
    const b = 2 * (1 - t) * t;
    const c = t * t;
    pts.push([
      a * FLAG_P0[0] + b * FLAG_P1[0] + c * FLAG_P2[0],
      a * FLAG_P0[1] + b * FLAG_P1[1] + c * FLAG_P2[1],
      // la bandierina si assottiglia verso la punta
      0.030 - 0.012 * t,
    ]);
  }
  return pts;
})();

function inFlag(x, y) {
  for (let i = 0; i < FLAG_SAMPLES.length - 1; i++) {
    const a = FLAG_SAMPLES[i];
    const b = FLAG_SAMPLES[i + 1];
    const r = (a[2] + b[2]) / 2;
    if (segDist(x, y, a[0], a[1], b[0], b[1]) <= r) return true;
  }
  return false;
}

const STAFF_Y = [0.402, 0.466, 0.530, 0.594, 0.658];
const STAFF_X0 = 0.132;
const STAFF_X1 = 0.868;
const STAFF_T = 0.0105;

function shade(x, y) {
  // sfondo: quadrato arrotondato con gradiente caldo
  if (!insideRoundRect(x, y, 0.030, 0.030, 0.970, 0.970, 0.208)) {
    return [0, 0, 0, 0];
  }

  const t = clamp01((1 - y) * 0.72 + (1 - x) * 0.28);
  let col = mix([1.0, 0.792, 0.298], [0.957, 0.412, 0.122], t);

  // rigo musicale (leggero, sullo sfondo)
  let onStaff = false;
  for (const sy of STAFF_Y) {
    if (y > sy - STAFF_T && y < sy + STAFF_T && x > STAFF_X0 && x < STAFF_X1) {
      onStaff = true;
      break;
    }
  }
  if (onStaff) col = mix(col, WHITE, 0.42);

  // nota (testa + gambo + bandierina) in bianco pieno
  const head = insideEllipse(x, y, 0.366, 0.586, 0.126, 0.088, -0.34);
  const stem = x > 0.477 && x < 0.508 && y > 0.272 && y < 0.590;
  if (head || stem || inFlag(x, y)) col = WHITE;

  return [col[0], col[1], col[2], 1];
}

function renderMaster(size, ss) {
  const W = size * ss;
  const out = Buffer.alloc(size * size * 4);

  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;
      for (let sy = 0; sy < ss; sy++) {
        for (let sx = 0; sx < ss; sx++) {
          const x = (px + (sx + 0.5) / ss) / size;
          const y = (py + (sy + 0.5) / ss) / size;
          const c = shade(x, y);
          r += c[0] * c[3];
          g += c[1] * c[3];
          b += c[2] * c[3];
          a += c[3];
        }
      }
      const n = ss * ss;
      const alpha = a / n;
      const i = (py * size + px) * 4;
      if (alpha > 0) {
        out[i] = Math.round(clamp01(r / a) * 255);
        out[i + 1] = Math.round(clamp01(g / a) * 255);
        out[i + 2] = Math.round(clamp01(b / a) * 255);
      }
      out[i + 3] = Math.round(clamp01(alpha) * 255);
    }
  }
  return out;
}

/* ------------------------------------------------------------------ ICO ---- */

function buildIco(pngBySize) {
  const sizes = Object.keys(pngBySize)
    .map(Number)
    .sort((a, b) => a - b);

  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type = icon
  header.writeUInt16LE(sizes.length, 4);

  const entries = [];
  const blobs = [];
  let offset = 6 + 16 * sizes.length;

  for (const s of sizes) {
    const png = pngBySize[s];
    const e = Buffer.alloc(16);
    e[0] = s >= 256 ? 0 : s; // 0 = 256
    e[1] = s >= 256 ? 0 : s;
    e[2] = 0; // palette
    e[3] = 0; // reserved
    e.writeUInt16LE(1, 4); // color planes
    e.writeUInt16LE(32, 6); // bit depth
    e.writeUInt32LE(png.length, 8);
    e.writeUInt32LE(offset, 12);
    entries.push(e);
    blobs.push(png);
    offset += png.length;
  }

  return Buffer.concat([header, ...entries, ...blobs]);
}

/* ----------------------------------------------------------------- MAIN ---- */

const outDir = process.argv[2] || '.';
const pngDir = process.argv[3] || outDir;
fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(pngDir, { recursive: true });

// Ogni dimensione viene disegnata direttamente alla sua risoluzione:
// il disegno è vettoriale, quindi il risultato resta nitido anche a 16 px
// e non dipende da strumenti esterni di ridimensionamento.
const SIZES = [16, 24, 32, 48, 64, 128, 192, 256, 512, 1024];

const pngBySize = {};
for (const size of SIZES) {
  // 4 campioni per pixel bastano sopra i 128 px; sotto serve più precisione
  // per non perdere il gambo sottile della nota.
  const ss = size <= 32 ? 5 : size <= 128 ? 4 : 2;
  const rgba = renderMaster(size, ss);
  pngBySize[size] = encodePNG(size, size, rgba);

  fs.writeFileSync(path.join(pngDir, `icon-${size}.png`), pngBySize[size]);
  if (size === 1024) {
    fs.writeFileSync(path.join(outDir, 'icon-1024.png'), pngBySize[size]);
  }
}
console.log(`✓ icon-1024.png + ${SIZES.length - 1} misure (${SIZES.join(', ')})`);

// ICO multi-risoluzione per Windows
const icoSizes = [16, 24, 32, 48, 64, 128, 256];
const icoSource = {};
for (const s of icoSizes) icoSource[s] = pngBySize[s];
fs.writeFileSync(path.join(outDir, 'icon.ico'), buildIco(icoSource));
console.log('✓ icon.ico (16-256)');
