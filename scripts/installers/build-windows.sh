#!/bin/bash
# scripts/installers/build-windows.sh
# Compila l'installer .exe per Windows con NSIS (cross-compilazione da macOS).
# Nessuna macchina Windows richiesta: NSIS produce un eseguibile nativo.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
VERSION="1.0.0"
OUT="$ROOT/installers/Windows"
STAGE="$ROOT/.build/windows/nsis"
ICON_SRC="$ROOT/.build/icon"

if ! command -v makensis >/dev/null 2>&1; then
  echo "ERRORE: makensis non trovato." >&2
  echo "Installa NSIS:  brew install makensis" >&2
  exit 1
fi

if [ ! -f "$ROOT/RitmoLab.html" ]; then
  echo "ERRORE: RitmoLab.html non trovato. Esegui prima: npm run build" >&2
  exit 1
fi

echo "==> Preparazione"
rm -rf "$STAGE"
mkdir -p "$STAGE" "$OUT"

echo "==> Icona .ico"
if [ ! -f "$ICON_SRC/icon.ico" ]; then
  if [ ! -f "$ICON_SRC/icon-1024.png" ]; then
    node "$ROOT/scripts/installers/make-icons.mjs" "$ICON_SRC"
  fi
  for s in 16 24 32 48 64 128 256; do
    sips -z "$s" "$s" "$ICON_SRC/icon-1024.png" --out "$ICON_SRC/icon-$s.png" >/dev/null 2>&1
  done
  node "$ROOT/scripts/installers/make-icons.mjs" "$ICON_SRC" "$ICON_SRC"
fi

echo "==> Copia file"
cp "$ROOT/RitmoLab.html"                        "$STAGE/RitmoLab.html"
cp "$ROOT/scripts/installers/LEGGIMI.txt"       "$STAGE/LEGGIMI.txt"
cp "$ICON_SRC/icon.ico"                         "$STAGE/icon.ico"
cp "$ROOT/scripts/installers/ritmolab-windows.nsi" "$STAGE/ritmolab-windows.nsi"

echo "==> Compilazione installer con NSIS"
cd "$STAGE"
makensis -V2 \
  -DAPP_VERSION="$VERSION" \
  -DOUTFILE="$OUT/RitmoLab-$VERSION-Windows-Setup.exe" \
  ritmolab-windows.nsi

echo
echo "✅ Windows completato"
ls -lh "$OUT"
