// scripts/installers/make-pwa.mjs
// Trasforma l'HTML standalone di RitmoLab in una pagina installabile come PWA:
// aggiunge il manifest, i meta tag richiesti da Chrome e la registrazione del
// service worker. Il contenuto dell'app resta invariato.

import fs from 'fs';

const [, , srcPath, outPath] = process.argv;
if (!srcPath || !outPath) {
  console.error('Uso: node make-pwa.mjs <RitmoLab.html> <output/index.html>');
  process.exit(1);
}

let html = fs.readFileSync(srcPath, 'utf-8');

// 1. Rimuove eventuali manifest già presenti, per non duplicarli.
html = html.replace(/<link[^>]+rel=["']manifest["'][^>]*>/gi, '');

// 2. Inserisce manifest + meta tag per l'installazione.
const headTags = [
  '<link rel="manifest" href="./manifest.webmanifest">',
  '<meta name="theme-color" content="#F59E0B">',
  '<meta name="application-name" content="RitmoLab">',
  '<meta name="apple-mobile-web-app-capable" content="yes">',
  '<meta name="apple-mobile-web-app-title" content="RitmoLab">',
  '<meta name="mobile-web-app-capable" content="yes">',
  '<link rel="apple-touch-icon" href="./icons/icon-192.png">',
].join('\n    ');

if (html.includes('</head>')) {
  html = html.replace('</head>', () => '    ' + headTags + '\n  </head>');
} else {
  html = headTags + '\n' + html;
}

// 3. Registra il service worker (solo se servito via http/https: da file://
//    i service worker non sono ammessi e la registrazione verrebbe rifiutata).
const swRegistration = `
    <script>
      if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
        window.addEventListener('load', function () {
          navigator.serviceWorker.register('./sw.js').catch(function () {});
        });
      }
    </script>
  `;

if (html.includes('</body>')) {
  html = html.replace('</body>', () => swRegistration + '\n</body>');
} else {
  html = html + swRegistration;
}

fs.writeFileSync(outPath, html, 'utf-8');
console.log('   ✓ index.html (PWA)');
