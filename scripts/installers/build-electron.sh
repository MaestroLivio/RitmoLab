#!/bin/bash
# scripts/installers/build-electron.sh
# Compila gli eseguibili AUTONOMI di RitmoLab con Electron.
#
# A differenza di build-macos.sh / build-windows.sh / build-chromeos.sh, che
# creano launcher che riutilizzano un browser già installato, questo script
# produce applicazioni complete: ogni pacchetto include il runtime
# Electron/Chromium e funziona su una macchina senza Chrome, Edge o altro.
#
# Uso:
#   bash scripts/installers/build-electron.sh              # macOS + Windows + Linux
#   bash scripts/installers/build-electron.sh macos        # solo macOS
#   bash scripts/installers/build-electron.sh windows      # solo Windows
#   bash scripts/installers/build-electron.sh linux        # solo Linux
#
# Variabili:
#   SKIP_BUILD=1     non ricompila RitmoLab.html, usa quello esistente
#   ARCH=arm64       limita l'architettura macOS (arm64 oppure x64)
#
# Prerequisiti: npm install (electron + electron-builder già presenti).

set -uo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
TARGET="${1:-all}"
VERSION="$(node -p "require('$ROOT/package.json').version" 2>/dev/null || echo 1.0.0)"

BUILD="$ROOT/.build/electron"
APP_DIR="$BUILD/app"
DIST_DIR="$BUILD/dist"
OUT="$ROOT/installers"

step() { printf '\n\033[1m%s\033[0m\n' "$1"; }
ok()   { printf '  \033[32m✓\033[0m %s\n' "$1"; }
warn() { printf '  \033[33m!\033[0m %s\n' "$1"; }
fail() { printf '  \033[31m✗\033[0m %s\n' "$1"; }

cd "$ROOT" || exit 1

# ---------------------------------------------------------------- 1. BUILD ---
step "1/3  Compilazione dell'app (Vite + HTML autonomo)"
if [ "${SKIP_BUILD:-0}" = "1" ] && [ -f "$ROOT/RitmoLab.html" ]; then
  ok "saltata (SKIP_BUILD=1): uso RitmoLab.html esistente"
else
  if npm run build; then
    ok "RitmoLab.html rigenerato ($(ls -lh "$ROOT/RitmoLab.html" | awk '{print $5}'))"
  else
    fail "Compilazione fallita. Esegui 'npm run build' per vedere l'errore."
    exit 1
  fi
fi

if [ ! -f "$ROOT/RitmoLab.html" ]; then
  fail "RitmoLab.html non trovato."
  exit 1
fi

# ------------------------------------------------------- 2. PREPARA L'APP ---
step "2/3  Preparazione del pacchetto applicativo"
rm -rf "$APP_DIR" "$DIST_DIR"
mkdir -p "$APP_DIR"

cp "$ROOT/RitmoLab.html"                "$APP_DIR/RitmoLab.html"
cp "$ROOT/electron/main-packaged.cjs"   "$APP_DIR/main.cjs"
cp "$ROOT/electron/preload-packaged.cjs" "$APP_DIR/preload.cjs"
sed -i '' "s/__RITMOLAB_VERSION__/$VERSION/" "$APP_DIR/preload.cjs" 2>/dev/null \
  || sed -i "s/__RITMOLAB_VERSION__/$VERSION/" "$APP_DIR/preload.cjs"

cat > "$APP_DIR/package.json" <<PKGJSON
{
  "name": "ritmolab",
  "productName": "RitmoLab",
  "version": "$VERSION",
  "description": "Laboratorio musicale per la scuola primaria",
  "main": "main.cjs",
  "author": "MaestroLivio",
  "license": "CC-BY-4.0",
  "private": true
}
PKGJSON

ok "app pronta: $(du -sh "$APP_DIR" | cut -f1) (RitmoLab.html + main + preload)"

# Icone: se mancano, rigenerale senza dipendenze esterne.
if [ ! -f "$ROOT/.build/icon/icon.ico" ] || [ ! -f "$ROOT/.build/icon/icon-1024.png" ]; then
  mkdir -p "$ROOT/.build/icon"
  node "$ROOT/scripts/installers/make-icons.mjs" "$ROOT/.build/icon" >/dev/null 2>&1
  ok "icone rigenerate"
fi

# ------------------------------------------------------------- 3. PACKAGE ---
step "3/3  Creazione degli eseguibili"

# --publish never: nessun upload automatico, i file restano locali.
COMMON=(--config "$ROOT/electron-builder.config.cjs" --publish never)

run_builder() {
  local label="$1"; shift
  printf '\n  → %s\n' "$label"
  if npx --no-install electron-builder "$@" "${COMMON[@]}" 2>&1 | sed 's/^/    /'; then
    return 0
  else
    return 1
  fi
}

FAILED=0

if [ "$TARGET" = "all" ] || [ "$TARGET" = "macos" ]; then
  # Su macOS le architetture si possono limitare con ARCH=arm64 / ARCH=x64.
  if [ -n "${ARCH:-}" ]; then
    run_builder "macOS ($ARCH)" --mac --"$ARCH" || FAILED=1
  else
    run_builder "macOS (arm64 + x64)" --mac || FAILED=1
  fi
fi

if [ "$TARGET" = "all" ] || [ "$TARGET" = "windows" ]; then
  run_builder "Windows (x64)" --win --x64 || FAILED=1
fi

if [ "$TARGET" = "all" ] || [ "$TARGET" = "linux" ]; then
  run_builder "Linux (x64)" --linux --x64 || FAILED=1
fi

# ------------------------------------------------------------- RACCOLTA -----
mkdir -p "$OUT/macOS" "$OUT/Windows" "$OUT/Linux"

shopt -s nullglob
for f in "$DIST_DIR"/*.dmg;   do cp -f "$f" "$OUT/macOS/";   done
for f in "$DIST_DIR"/*.pkg;   do cp -f "$f" "$OUT/macOS/";   done
for f in "$DIST_DIR"/*-mac*.zip; do cp -f "$f" "$OUT/macOS/"; done
for f in "$DIST_DIR"/*.exe;   do cp -f "$f" "$OUT/Windows/"; done
for f in "$DIST_DIR"/*.AppImage "$DIST_DIR"/*.deb; do cp -f "$f" "$OUT/Linux/"; done
shopt -u nullglob

step "Riepilogo"
shopt -s nullglob
FOUND=0
for dir in macOS Windows Linux; do
  for f in "$OUT/$dir"/*; do
    case "$f" in
      *.dmg|*.pkg|*.exe|*.zip|*.AppImage|*.deb)
        printf '  %-52s %s\n' "${f#$OUT/}" "$(ls -lh "$f" | awk '{print $5}')"
        FOUND=$((FOUND + 1))
        ;;
    esac
  done
done
shopt -u nullglob

if [ "$FOUND" = "0" ]; then
  fail "Nessun pacchetto prodotto."
  exit 1
fi

if [ "$FAILED" = "1" ]; then
  warn "Una o più piattaforme non sono state completate (vedi sopra)."
  exit 2
fi

printf '\n✅ Eseguibili pronti in %s\n' "$OUT"
