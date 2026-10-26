#!/bin/bash
# scripts/installers/build-macos.sh
# Crea RitmoLab.app (bundle nativo), il pacchetto .pkg e prepara la cartella
# per il DMG. Funziona su Apple Silicon e su Intel: il launcher è uno script
# bash che apre il primo browser Chromium disponibile in modalità app.
#
# Uso:  bash scripts/installers/build-macos.sh
#       SKIP_DMG=1 bash ...   # salta la creazione dell'immagine disco
#
# Nota: la creazione del DMG richiede hdiutil, che necessita di permessi
# estesi su macOS recenti. Se fallisce, esegui a mano il comando stampato
# a fine script.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
APP_NAME="RitmoLab"
VERSION="1.1.0"
BUILD="$ROOT/.build/macos"
OUT="$ROOT/installers/macOS"
ICON_SRC="$ROOT/.build/icon"

echo "==> Preparazione cartelle"
rm -rf "$BUILD"
mkdir -p "$BUILD" "$OUT"

APP="$BUILD/$APP_NAME.app"
CONTENTS="$APP/Contents"
MACOS="$CONTENTS/MacOS"
RES="$CONTENTS/Resources"
mkdir -p "$MACOS" "$RES"

echo "==> Copia applicazione"
if [ ! -f "$ROOT/RitmoLab.html" ]; then
  echo "ERRORE: RitmoLab.html non trovato. Esegui prima: npm run build" >&2
  exit 1
fi
cp "$ROOT/RitmoLab.html" "$RES/RitmoLab.html"

echo "==> Icona"
if [ ! -f "$ICON_SRC/icon-1024.png" ]; then
  node "$ROOT/scripts/installers/make-icons.mjs" "$ICON_SRC"
fi

ICONSET="$BUILD/icon.iconset"
mkdir -p "$ICONSET"
for spec in "16 icon_16x16" "32 icon_16x16@2x" "32 icon_32x32" "64 icon_32x32@2x" \
            "128 icon_128x128" "256 icon_128x128@2x" "256 icon_256x256" \
            "512 icon_256x256@2x" "512 icon_512x512" "1024 icon_512x512@2x"; do
  size="${spec%% *}"
  name="${spec##* }"
  sips -z "$size" "$size" "$ICON_SRC/icon-1024.png" --out "$ICONSET/$name.png" >/dev/null 2>&1
done
iconutil -c icns "$ICONSET" -o "$RES/RitmoLab.icns"
cp "$ICON_SRC/icon-1024.png" "$RES/RitmoLab.png"

echo "==> Info.plist"
cat > "$CONTENTS/Info.plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleName</key><string>$APP_NAME</string>
  <key>CFBundleDisplayName</key><string>$APP_NAME</string>
  <key>CFBundleIdentifier</key><string>it.ritmolab.app</string>
  <key>CFBundleVersion</key><string>$VERSION</string>
  <key>CFBundleShortVersionString</key><string>$VERSION</string>
  <key>CFBundlePackageType</key><string>APPL</string>
  <key>CFBundleSignature</key><string>????</string>
  <key>CFBundleExecutable</key><string>$APP_NAME</string>
  <key>CFBundleIconFile</key><string>RitmoLab.icns</string>
  <key>CFBundleInfoDictionaryVersion</key><string>6.0</string>
  <key>LSMinimumSystemVersion</key><string>11.0</string>
  <key>LSApplicationCategoryType</key><string>public.app-category.education</string>
  <key>NSHighResolutionCapable</key><true/>
  <key>NSCameraUsageDescription</key><string>RitmoLab usa la fotocamera solo se richiesto dagli esercizi.</string>
  <key>NSMicrophoneUsageDescription</key><string>RitmoLab usa il microfono per verificare l'intonazione negli esercizi di canto.</string>
  <key>NSHumanReadableCopyright</key><string>RitmoLab - Laboratorio Musicale per la Scuola Primaria</string>
</dict>
</plist>
PLIST

echo "==> Launcher"
cat > "$MACOS/$APP_NAME" <<'LAUNCHER'
#!/bin/bash
# Launcher RitmoLab: apre l'app in una finestra dedicata usando il primo
# browser Chromium disponibile. Nessun runtime aggiuntivo richiesto.

APP_DIR="$(cd "$(dirname "$0")/../Resources" 2>/dev/null && pwd)"
APP_FILE="$APP_DIR/RitmoLab.html"

if [ -z "$APP_DIR" ] || [ ! -f "$APP_FILE" ]; then
  osascript -e 'display alert "RitmoLab" message "Impossibile trovare i file dell applicazione." as critical' >/dev/null 2>&1
  exit 1
fi

APP_URL="file://$APP_FILE"
PROFILE_DIR="$HOME/Library/Application Support/RitmoLab/BrowserProfile"
mkdir -p "$PROFILE_DIR" 2>/dev/null

find_browser() {
  for p in \
    "/Applications/Google Chrome.app" \
    "$HOME/Applications/Google Chrome.app" \
    "/Applications/Microsoft Edge.app" \
    "$HOME/Applications/Microsoft Edge.app" \
    "/Applications/Brave Browser.app" \
    "/Applications/Chromium.app" \
    "/Applications/Vivaldi.app" \
    "/Applications/Arc.app" \
    "/Applications/Opera.app"; do
    if [ -d "$p" ]; then printf '%s' "$p"; return 0; fi
  done
  return 1
}

BROWSER="$(find_browser || true)"

if [ -n "$BROWSER" ]; then
  open -na "$BROWSER" --args \
    --app="$APP_URL" \
    --user-data-dir="$PROFILE_DIR" \
    --no-first-run \
    --no-default-browser-check \
    --start-maximized \
    --autoplay-policy=no-user-gesture-required
else
  # Nessun browser Chromium: apri nel browser predefinito.
  open "$APP_FILE"
fi
LAUNCHER
chmod +x "$MACOS/$APP_NAME"

echo "==> Firma ad-hoc"
codesign --force --deep --sign - "$APP" >/dev/null 2>&1 \
  || echo "   (firma ad-hoc non riuscita: il bundle resta comunque eseguibile)"

echo "==> Pacchetto .pkg"
PKGROOT="$BUILD/pkgroot"
rm -rf "$PKGROOT"
mkdir -p "$PKGROOT/Applications"
cp -R "$APP" "$PKGROOT/Applications/"
if pkgbuild --root "$PKGROOT" \
            --identifier "it.ritmolab.app" \
            --version "$VERSION" \
            --install-location "/" \
            "$OUT/RitmoLab-$VERSION-macOS.pkg" >/dev/null 2>&1; then
  echo "   ✓ RitmoLab-$VERSION-macOS.pkg"
else
  echo "   ! pkgbuild non disponibile: pacchetto .pkg saltato"
fi

echo "==> Preparazione cartella DMG"
STAGE="$BUILD/dmg-stage"
rm -rf "$STAGE"
mkdir -p "$STAGE"
cp -R "$APP" "$STAGE/"
ln -s /Applications "$STAGE/Applications"

DMG="$OUT/RitmoLab-$VERSION-macOS.dmg"
if [ "${SKIP_DMG:-0}" != "1" ]; then
  echo "==> Creazione DMG"
  rm -f "$DMG"
  if hdiutil create -volname "RitmoLab $VERSION" -srcfolder "$STAGE" \
                    -ov -format UDZO -quiet "$DMG" 2>/dev/null; then
    echo "   ✓ $(basename "$DMG")"
  else
    echo "   ! hdiutil non disponibile in questo ambiente."
    echo "     Crea il DMG manualmente con:"
    echo "     hdiutil create -volname 'RitmoLab $VERSION' -srcfolder '$STAGE' -ov -format UDZO '$DMG'"
  fi
fi

echo
echo "✅ macOS completato"
ls -lh "$OUT" 2>/dev/null | tail -n +2
