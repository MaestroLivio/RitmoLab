// scripts/build-standalone-html.js
// Bundles dist/index.html and its CSS/JS into a single, 100% self-contained HTML file
// for ChromeOS Flex, Chromebooks, Windows, Mac, and Linux offline without installation.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.resolve(rootDir, 'dist');
const distIndex = path.resolve(distDir, 'index.html');
const standaloneHtmlOutput = path.resolve(rootDir, 'RitmoLab.html');

if (!fs.existsSync(distIndex)) {
  console.error('Error: dist/index.html not found. Run "vite build" first.');
  process.exit(1);
}

// Read the ORIGINAL dist/index.html (never write back to it to avoid double-injection)
let html = fs.readFileSync(distIndex, 'utf-8');

// 1. Find and inline CSS
const cssFiles = fs.readdirSync(path.resolve(distDir, 'assets')).filter(f => f.endsWith('.css'));
let combinedCss = '';
for (const file of cssFiles) {
  const filePath = path.resolve(distDir, 'assets', file);
  combinedCss += fs.readFileSync(filePath, 'utf-8') + '\n';
}

// Remove external CSS links
html = html.replace(/<link\s+[^>]*rel=["']stylesheet["'][^>]*>/gi, '');

// 2. Find and inline JS
const jsFiles = fs.readdirSync(path.resolve(distDir, 'assets')).filter(f => f.endsWith('.js'));
let combinedJs = '';
for (const file of jsFiles) {
  const filePath = path.resolve(distDir, 'assets', file);
  combinedJs += fs.readFileSync(filePath, 'utf-8') + '\n';
}

// Escape </script> and </body> and </head> inside JS so the browser doesn't
// prematurely close the script block or body/head elements.
combinedJs = combinedJs.replace(/<\/(script|body|head)>/gi, '<\\/$1>');

// Remove existing module scripts and modulepreload links from head/body
html = html.replace(/<script\s+[^>]*src=[^>]*><\/script>/gi, '');
html = html.replace(/<link\s+[^>]*rel=["']modulepreload["'][^>]*>/gi, '');

// 3. Inject CSS into <head>
// NOTE: We use arrow-function replacements everywhere to prevent
// JavaScript's String.replace() from interpreting $& / $` / $' etc.
// in the replacement string (the minified JS contains "$&/" patterns).
const styleTag = '<style>\n' + combinedCss + '\n</style>';
if (html.includes('</head>')) {
  html = html.replace('</head>', () => styleTag + '\n</head>');
} else {
  html = styleTag + '\n' + html;
}

// 4. Inject visual loading state into #root if empty
const loadingPlaceholder =
    '<div id="root" class="h-full w-full">\n' +
    '      <div style="display:flex;height:100vh;width:100vw;align-items:center;justify-content:center;background:#FFFBEB;font-family:sans-serif;color:#854D0E;">\n' +
    '        <div style="text-align:center;padding:20px;">\n' +
    '          <div style="font-size:48px;margin-bottom:12px;animation:spin 1s infinite linear;">🎵</div>\n' +
    '          <h2 style="font-size:22px;font-weight:bold;margin-bottom:6px;">Caricamento RitmoLab in corso...</h2>\n' +
    '          <p style="font-size:13px;color:#A16207;">Attendi un istante mentre il laboratorio musicale si avvia.</p>\n' +
    '        </div>\n' +
    '      </div>\n' +
    '    </div>';

html = html.replace(/<div id=["']root["'][^>]*><\/div>/gi, () => loadingPlaceholder);

// 5. Inject Error Handler into <head>
const errorHandlerScript =
    '<script>\n' +
    '      window.onerror = function(msg, url, line, col, err) {\n' +
    '        console.error("RitmoLab Error:", msg, "at", url, line, col, err);\n' +
    '        var root = document.getElementById("root");\n' +
    '        if (root && (!root.children.length || root.innerHTML.indexOf("Caricamento") !== -1)) {\n' +
    '          root.innerHTML = \'<div style="display:flex;height:100vh;align-items:center;justify-content:center;background:#FFFBEB;font-family:sans-serif;padding:20px;">\' +\n' +
    '            \'<div style="background:white;padding:32px;border-radius:24px;border:2px solid #F87171;box-shadow:0 10px 25px rgba(0,0,0,0.1);max-width:550px;text-align:center;">\' +\n' +
    '            \'<div style="font-size:48px;margin-bottom:12px;">⚠️</div>\' +\n' +
    '            \'<h2 style="color:#991B1B;font-size:20px;font-weight:bold;margin-bottom:8px;">Avviso di Caricamento</h2>\' +\n' +
    '            \'<p style="color:#7F1D1D;font-size:13px;margin-bottom:12px;">\' + msg + \'</p>\' +\n' +
    '            \'<button onclick="location.reload()" style="padding:10px 24px;background:#10B981;color:white;font-weight:bold;border:none;border-radius:12px;cursor:pointer;">Ricarica Pagina</button>\' +\n' +
    '            \'</div></div>\';\n' +
    '        }\n' +
    '      };\n' +
    '    </script>\n';

html = html.replace('</head>', () => errorHandlerScript + '</head>');

// 6. Inject the JavaScript at the bottom of <body>, AFTER #root
// CRITICAL: Use arrow-function replacement to prevent $& expansion!
const jsTag = '<script>\n' + combinedJs + '\n<' + '/script>';
if (html.includes('</body>')) {
  html = html.replace('</body>', () => jsTag + '\n</body>');
} else {
  html = html + '\n' + jsTag;
}

// Write ONLY the standalone file (never overwrite dist/index.html)
fs.writeFileSync(standaloneHtmlOutput, html, 'utf-8');

console.log(`\n🎉 Standalone build complete!`);
console.log(`✓ CSS inlined into <head>: ${(combinedCss.length / 1024).toFixed(1)} KB`);
console.log(`✓ JS inlined at bottom of <body>: ${(combinedJs.length / 1024).toFixed(1)} KB`);
console.log(`📁 Output: ${standaloneHtmlOutput}`);
console.log(`✨ Ready for ChromeOS Flex offline (double-click to open).`);
