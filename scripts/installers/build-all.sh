#!/bin/bash
# scripts/installers/build-all.sh
# Compila tutti gli installer di RitmoLab: macOS, Windows e ChromeOS.
#
# Uso:
#   bash scripts/installers/build-all.sh              # tutto
#   bash scripts/installers/build-all.sh macos        # solo macOS
#   bash scripts/installers/build-all.sh windows      # solo Windows
#   bash scripts/installers/build-all.sh chromeos     # solo ChromeOS
#
# Prerequisiti:
#   - Node.js e le dipendenze del progetto (npm install)
#   - NSIS per l'installer Windows:  brew install makensis
#   - macOS: strumenti Xcode (sips, iconutil, codesign, pkgbuild)
#
# Nota: la creazione del DMG usa hdiutil, che su macOS recenti può richiedere
# permessi estesi. Se fallisce, lo script stampa il comando da eseguire a mano.

set -uo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
TARGET="${1:-all}"
OUT="$ROOT/installers"

cd "$ROOT" || exit 1

step() { printf '\n\033[1m%s\033[0m\n' "$1"; }
fail() { printf '\033[31m✗ %s\033[0m\n' "$1"; }

# ---------------------------------------------------------------- 1. BUILD ---
step "1/4  Compilazione dell'app (Vite)"
if [ "${SKIP_BUILD:-0}" = "1" ]; then
  printf '     - saltata (SKIP_BUILD=1): uso RitmoLab.html esistente\n'
else
  if ! npm run build; then
    fail "Compilazione fallita. Esegui 'npm run build' per vedere l'errore."
    exit 1
  fi
fi
if [ ! -f "$ROOT/RitmoLab.html" ]; then
  fail "RitmoLab.html non generato."
  exit 1
fi
printf '     ✓ RitmoLab.html (%s)\n' "$(ls -lh "$ROOT/RitmoLab.html" | awk '{print $5}')"

# ---------------------------------------------------------------- 2. ICONA ---
step "2/4  Icone"
if [ ! -f "$ROOT/.build/icon/icon.ico" ]; then
  mkdir -p "$ROOT/.build/icon"
  node "$ROOT/scripts/installers/make-icons.mjs" "$ROOT/.build/icon" >/dev/null 2>&1
  for s in 16 24 32 48 64 128 192 256 512; do
    sips -z $s $s "$ROOT/.build/icon/icon-1024.png" \
         --out "$ROOT/.build/icon/icon-$s.png" >/dev/null 2>&1
  done
  node "$ROOT/scripts/installers/make-icons.mjs" "$ROOT/.build/icon" "$ROOT/.build/icon" >/dev/null 2>&1
fi
printf '     ✓ icon-1024.png, icon.ico\n'

mkdir -p "$OUT"

# ---------------------------------------------------------------- 3. PIATTA ---
step "3/4  Installer per piattaforma"

if [ "$TARGET" = "all" ] || [ "$TARGET" = "macos" ]; then
  printf '\n  → macOS\n'
  if SKIP_DMG=1 bash "$ROOT/scripts/installers/build-macos.sh" 2>&1 | sed 's/^/     /'; then
    printf '     ✓ DMG richiesto (vedi comando sotto)\n'
  else
    fail "macOS: compilazione non riuscita"
  fi
fi

if [ "$TARGET" = "all" ] || [ "$TARGET" = "windows" ]; then
  printf '\n  → Windows\n'
  if bash "$ROOT/scripts/installers/build-windows.sh" 2>&1 | sed 's/^/     /'; then
    :
  else
    fail "Windows: compilazione non riuscita (serve makensis)"
  fi
fi

if [ "$TARGET" = "all" ] || [ "$TARGET" = "chromeos" ]; then
  printf '\n  → ChromeOS\n'
  if bash "$ROOT/scripts/installers/build-chromeos.sh" 2>&1 | sed 's/^/     /'; then
    :
  else
    fail "ChromeOS: compilazione non riuscita"
  fi
fi

# ---------------------------------------------------------------- 4. ZIP -----
step "4/4  Archivio completo"
DIST_NAME="RitmoLab-$(date +%Y%m%d)-tutte-le-piattaforme"
rm -rf "/tmp/$DIST_NAME"
mkdir -p "/tmp/$DIST_NAME"
cp -R "$OUT/macOS"   "/tmp/$DIST_NAME/" 2>/dev/null
cp -R "$OUT/Windows" "/tmp/$DIST_NAME/" 2>/dev/null
cp -R "$OUT/ChromeOS" "/tmp/$DIST_NAME/" 2>/dev/null
cp "$ROOT/installers/LEGGIMI.txt" "/tmp/$DIST_NAME/" 2>/dev/null
if (cd /tmp && zip -qr -X "$OUT/$DIST_NAME.zip" "$DIST_NAME"); then
  printf '     ✓ %s.zip\n' "$DIST_NAME"
fi
rm -rf "/tmp/$DIST_NAME"

# ---------------------------------------------------------------- RIEPILOGO -
step "Riepilogo"
find "$OUT" -maxdepth 2 -type f \( -name "*.dmg" -o -name "*.pkg" -o -name "*.exe" \
    -o -name "*.zip" -o -name "*.deb" \) -print0 2>/dev/null \
  | while IFS= read -r -d '' f; do
      printf '  %-46s %s\n' "${f#$OUT/}" "$(ls -lh "$f" | awk '{print $5}')"
    done

printf '\nOutput: %s\n\n' "$OUT"
