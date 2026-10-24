#!/bin/bash
# scripts/installers/build-chromeos.sh
# Crea tre pacchetti per ChromeOS / ChromeOS Flex:
#
#  1. RitmoLab-ChromeOS.zip
#     App autonoma: si apre con doppio clic, funziona offline, nessuna
#     installazione. È il metodo più semplice e funziona su QUALSIASI
#     dispositivo ChromeOS.
#
#  2. RitmoLab-ChromeOS-PWA.zip
#     Versione installabile come app (compare sulla shelf come le app native).
#     Include manifest, service worker e un server locale minimale:
#     basta avviare il server e Chrome mostra il pulsante "Installa".
#
#  3. RitmoLab-1.0.0-chromeos.deb
#     Per i dispositivi ChromeOS con Linux (Crostini) attivo: installa
#     l'app in /opt/ritmolab, crea la voce nel menu e il launcher.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
VERSION="1.0.0"
OUT="$ROOT/installers/ChromeOS"
BUILD="$ROOT/.build/chromeos"
ICON_SRC="$ROOT/.build/icon"

if [ ! -f "$ROOT/RitmoLab.html" ]; then
  echo "ERRORE: RitmoLab.html non trovato. Esegui prima: npm run build" >&2
  exit 1
fi

if [ ! -f "$ICON_SRC/icon-1024.png" ]; then
  node "$ROOT/scripts/installers/make-icons.mjs" "$ICON_SRC"
fi
for s in 192 512; do
  [ -f "$ICON_SRC/icon-$s.png" ] || sips -z $s $s "$ICON_SRC/icon-1024.png" --out "$ICON_SRC/icon-$s.png" >/dev/null 2>&1
done

rm -rf "$BUILD"
mkdir -p "$BUILD" "$OUT"

HTML_BYTES=$(wc -c < "$ROOT/RitmoLab.html" | tr -d ' ')
HTML_MB=$(echo "scale=1; $HTML_BYTES / 1048576" | bc)

# ---------------------------------------------------------------- 1) ZIP ----
echo "==> 1/3  Pacchetto autonomo (doppio clic)"
PLAIN="$BUILD/plain"
mkdir -p "$PLAIN"
cp "$ROOT/RitmoLab.html" "$PLAIN/RitmoLab.html"

cat > "$PLAIN/LEGGIMI.txt" <<TXT
RitmoLab $VERSION - ChromeOS / ChromeOS Flex
============================================

AVVIO RAPIDO
------------
1. Copia questa cartella sul Chromebook (per esempio nella cartella "Download").
2. Apri la cartella "File" di ChromeOS e fai doppio clic su "RitmoLab.html".

L'app si apre subito, funziona offline e non richiede installazione.
Per averla sempre a portata di mano puoi aggiungerla alla shelf:

  Trascina il file RitmoLab.html sulla shelf (barra in basso), oppure
  apri il menu del browser (i tre puntini) > "Salva e condividi" (o
  "Altri strumenti") > "Crea collegamento" e spunta "Apri come finestra".

Suggerimento: tieni il file in una cartella stabile (non in "Download",
che ChromeOS può svuotare) e crea un collegamento alla cartella.

MICROFONO
---------
Gli esercizi di canto chiedono il permesso del microfono al primo uso.
Se lo neghi, riapri il file e riabilitalo dall'icona accanto alla barra
degli indirizzi.

App installabile sulla shelf
----------------------------
Se preferisci un'app vera e propria (icona sulla shelf, finestra dedicata),
usa il pacchetto "RitmoLab-ChromeOS-PWA.zip": contiene le istruzioni.

Offline
-------
Tutto è dentro il file HTML: audio, immagini, stili e codice.
Non serve connessione a Internet e nessun dato viene inviato all'esterno.
TXT

(cd "$PLAIN" && zip -qr -X "$OUT/RitmoLab-ChromeOS.zip" .)
echo "   ✓ RitmoLab-ChromeOS.zip"

# ---------------------------------------------------------------- 2) PWA ----
echo "==> 2/3  Pacchetto installabile (PWA)"
PWA="$BUILD/pwa"
mkdir -p "$PWA/icons"

# L'HTML dell'app diventa il corpo della PWA: aggiungiamo manifest,
# meta tag per installabilità e la registrazione del service worker.
node "$ROOT/scripts/installers/make-pwa.mjs" "$ROOT/RitmoLab.html" "$PWA/index.html"

cat > "$PWA/manifest.webmanifest" <<'JSON'
{
  "name": "RitmoLab - Laboratorio Musicale",
  "short_name": "RitmoLab",
  "description": "Laboratorio musicale per la scuola primaria: ritmo, solfeggio, canto, gesti Kodaly e DAW.",
  "start_url": "./index.html",
  "scope": "./",
  "display": "standalone",
  "orientation": "any",
  "background_color": "#FFFBEB",
  "theme_color": "#F59E0B",
  "lang": "it",
  "categories": ["education", "music"],
  "icons": [
    { "src": "icons/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any" },
    { "src": "icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any" },
    { "src": "icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
JSON

cp "$ICON_SRC/icon-192.png" "$PWA/icons/icon-192.png"
cp "$ICON_SRC/icon-512.png" "$PWA/icons/icon-512.png"

cat > "$PWA/sw.js" <<'JS'
// Service worker di RitmoLab: mantiene l'app disponibile offline.
const CACHE = 'ritmolab-v1';
const ASSETS = ['./', './index.html', './manifest.webmanifest',
                './icons/icon-192.png', './icons/icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then((hit) =>
      hit ||
      fetch(e.request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match('./index.html'))
    )
  );
});
JS

cat > "$PWA/serve.sh" <<'SH'
#!/bin/bash
# Avvia RitmoLab in modalità app installabile.
# Su ChromeOS con Linux attivo:  bash serve.sh
# Su qualsiasi sistema con Python 3:  bash serve.sh
cd "$(dirname "$0")" || exit 1

PORT=8731

echo "RitmoLab - avvio in corso..."
echo

if command -v python3 >/dev/null 2>&1; then
  python3 -m http.server "$PORT" --bind 127.0.0.1 >/dev/null 2>&1 &
  SERVER_PID=$!
elif command -v python >/dev/null 2>&1; then
  python -m SimpleHTTPServer "$PORT" >/dev/null 2>&1 &
  SERVER_PID=$!
else
  echo "ERRORE: Python non trovato." >&2
  echo "Apri index.html direttamente, oppure usa il pacchetto RitmoLab-ChromeOS.zip" >&2
  exit 1
fi

trap 'kill $SERVER_PID 2>/dev/null' EXIT INT TERM
sleep 1

URL="http://127.0.0.1:$PORT/index.html"
echo "Aperto: $URL"
echo
echo "Nella barra degli indirizzi di Chrome compare l'icona di installazione"
echo "(un monitor con una freccia). Premila per installare RitmoLab sulla shelf."
echo
echo "Premi Ctrl+C per fermare il server."

if command -v xdg-open >/dev/null 2>&1; then
  xdg-open "$URL" >/dev/null 2>&1
elif command -v google-chrome >/dev/null 2>&1; then
  google-chrome --app="$URL" >/dev/null 2>&1 &
elif command -v chromium >/dev/null 2>&1; then
  chromium --app="$URL" >/dev/null 2>&1 &
else
  echo "Apri manualmente questo indirizzo nel browser: $URL"
fi

wait $SERVER_PID 2>/dev/null
SH
chmod +x "$PWA/serve.sh"

cat > "$PWA/LEGGIMI.txt" <<TXT
RitmoLab $VERSION - versione installabile (PWA)
===============================================

Questa versione installa RitmoLab come una vera app: icona sulla shelf,
finestra dedicata e avvio anche senza connessione.

REQUISITI
---------
ChromeOS, ChromeOS Flex, oppure Chrome/Edge su Windows, Mac e Linux.
Su ChromeOS Flex serve il supporto Linux attivo solo per il passaggio 1B.

INSTALLAZIONE
-------------
A) Se hai il terminale Linux attivo (ChromeOS > Impostazioni > Sviluppatori
   > Terminale Linux):

     1. Estrai questa cartella.
     2. Apri il Terminale Linux e spostati nella cartella.
     3. Esegui:   bash serve.sh
     4. In Chrome, nella barra degli indirizzi, premi l'icona di
        installazione (un monitor con la freccia) oppure menu > "Installa RitmoLab".
     5. Chiudi il terminale: l'app resta installata e funziona offline.

B) Se NON hai Linux attivo:

     1. Apri l'app "File" di ChromeOS.
     2. Fai doppio clic su "index.html".
     3. L'app funziona, ma senza icona sulla shelf.
        Per l'icona usa il pacchetto RitmoLab-ChromeOS.zip e segui il
        suo LEGGIMI (collegamento "Apri come finestra").

DISINSTALLAZIONE
----------------
Tieni premuto l'icona di RitmoLab sulla shelf e scegli "Disinstalla",
oppure menu del browser > "Installa app" > "Disinstalla".

MICROFONO
---------
Il permesso del microfono viene chiesto al primo esercizio di canto e
resta memorizzato per l'app installata.

OFFLINE
-------
Il service worker salva l'app nella cache del browser: dopo la prima
apertura funziona anche senza rete.
TXT

(cd "$PWA" && zip -qr -X "$OUT/RitmoLab-ChromeOS-PWA.zip" .)
echo "   ✓ RitmoLab-ChromeOS-PWA.zip"

# ---------------------------------------------------------------- 3) DEB ----
echo "==> 3/3  Pacchetto Debian (ChromeOS con Linux)"
DEB="$BUILD/deb"
DEBROOT="$DEB/root"
mkdir -p "$DEBROOT/DEBIAN" \
         "$DEBROOT/opt/ritmolab/www/icons" \
         "$DEBROOT/usr/bin" \
         "$DEBROOT/usr/share/applications" \
         "$DEBROOT/usr/share/icons/hicolor/512x512/apps"

cp "$PWA/index.html"  "$DEBROOT/opt/ritmolab/www/index.html"
cp "$PWA/manifest.webmanifest" "$DEBROOT/opt/ritmolab/www/manifest.webmanifest"
cp "$PWA/sw.js"       "$DEBROOT/opt/ritmolab/www/sw.js"
cp "$ICON_SRC/icon-192.png" "$DEBROOT/opt/ritmolab/www/icons/icon-192.png"
cp "$ICON_SRC/icon-512.png" "$DEBROOT/opt/ritmolab/www/icons/icon-512.png"
cp "$ICON_SRC/icon-512.png" "$DEBROOT/usr/share/icons/hicolor/512x512/apps/ritmolab.png"
cp "$ROOT/RitmoLab.html" "$DEBROOT/opt/ritmolab/RitmoLab.html"

cat > "$DEBROOT/usr/bin/ritmolab" <<'SH'
#!/bin/bash
# Launcher RitmoLab per ChromeOS (Crostini) e per distribuzioni Debian/Ubuntu.
# Avvia un server locale sulla porta libera più bassa disponibile e apre
# l'app in una finestra dedicata. Se non trova un browser Chromium, apre
# il file HTML con il browser predefinito.

WWW="/opt/ritmolab/www"
PORT=8731

# trova una porta libera
for p in $(seq 8731 8760); do
  if ! (echo > /dev/tcp/127.0.0.1/$p) >/dev/null 2>&1; then
    PORT=$p
    break
  fi
done

cd "$WWW" || { xdg-open /opt/ritmolab/RitmoLab.html 2>/dev/null; exit 1; }

if command -v python3 >/dev/null 2>&1; then
  python3 -m http.server "$PORT" --bind 127.0.0.1 >/dev/null 2>&1 &
elif command -v python >/dev/null 2>&1; then
  python -m SimpleHTTPServer "$PORT" >/dev/null 2>&1 &
else
  xdg-open /opt/ritmolab/RitmoLab.html 2>/dev/null
  exit 0
fi

SERVER_PID=$!
trap 'kill $SERVER_PID 2>/dev/null' EXIT INT TERM
sleep 1

URL="http://127.0.0.1:$PORT/index.html"

for b in google-chrome google-chrome-stable chromium chromium-browser microsoft-edge brave-browser; do
  if command -v "$b" >/dev/null 2>&1; then
    "$b" --app="$URL" --start-maximized --no-first-run \
         --autoplay-policy=no-user-gesture-required >/dev/null 2>&1 &
    BROWSER_PID=$!
    wait $BROWSER_PID 2>/dev/null
    exit 0
  fi
done

xdg-open "$URL" >/dev/null 2>&1
wait $SERVER_PID 2>/dev/null
SH
chmod +x "$DEBROOT/usr/bin/ritmolab"

cat > "$DEBROOT/usr/share/applications/ritmolab.desktop" <<'DESK'
[Desktop Entry]
Type=Application
Version=1.0
Name=RitmoLab
GenericName=Laboratorio Musicale
Comment=Laboratorio musicale per la scuola primaria: ritmo, solfeggio, canto e DAW
Exec=/usr/bin/ritmolab
Icon=ritmolab
Terminal=false
Categories=Education;AudioVideo;Music;
Keywords=musica;ritmo;solfeggio;canto;scuola;primaria;daw;
StartupNotify=true
DESK

SIZE_KB=$(du -sk "$DEBROOT" | cut -f1)

cat > "$DEBROOT/DEBIAN/control" <<CTRL
Package: ritmolab
Version: $VERSION
Section: education
Priority: optional
Architecture: all
Depends: python3 | python
Installed-Size: $SIZE_KB
Maintainer: RitmoLab <info@ritmolab.local>
Description: Laboratorio musicale per la scuola primaria
 RitmoLab e' un laboratorio musicale pensato per la scuola primaria:
 esercizi di ritmo, solfeggio e canto, gesti Kodaly, body percussion,
 strumenti configurabili e una DAW per creare partiture.
 .
 Funziona completamente offline e non richiede connessione a Internet.
 Appositamente confezionato per ChromeOS con Linux (Crostini), oltre che
 per Debian e Ubuntu.
CTRL

cat > "$DEBROOT/DEBIAN/postinst" <<'POST'
#!/bin/bash
set -e
if command -v update-desktop-database >/dev/null 2>&1; then
  update-desktop-database -q /usr/share/applications || true
fi
if command -v gtk-update-icon-cache >/dev/null 2>&1; then
  gtk-update-icon-cache -q -t -f /usr/share/icons/hicolor || true
fi
exit 0
POST
chmod 755 "$DEBROOT/DEBIAN/postinst"

cat > "$DEBROOT/DEBIAN/prerm" <<'PRE'
#!/bin/bash
exit 0
PRE
chmod 755 "$DEBROOT/DEBIAN/prerm"

cp -R "$DEBROOT" "$DEB/root-copy" 2>/dev/null || true
(cd "$DEBROOT" && find . -type f ! -path "./DEBIAN/*" | sed 's|^\./||' > "$DEB/files.txt")
(cd "$DEBROOT" && tar -czf "$DEB/data.tar.gz" -T "$DEB/files.txt" --owner=0 --group=0)
(cd "$DEBROOT/DEBIAN" && tar -czf "$DEB/control.tar.gz" --owner=0 --group=0 ./control ./postinst ./prerm)
printf '2.0\n' > "$DEB/debian-binary"

DEBFILE="$OUT/RitmoLab-$VERSION-chromeos.deb"
rm -f "$DEBFILE"
(cd "$DEB" && ar -q -c "$DEBFILE" debian-binary control.tar.gz data.tar.gz >/dev/null 2>&1) \
  || ar rcs "$DEBFILE" "$DEB/debian-binary" "$DEB/control.tar.gz" "$DEB/data.tar.gz"

echo "   ✓ $(basename "$DEBFILE")"

cat > "$OUT/LEGGIMI.txt" <<TXT
RitmoLab $VERSION - Installazione su ChromeOS / ChromeOS Flex
=============================================================

Ci sono tre modi per usare RitmoLab su un Chromebook. Scegli quello
adatto al tuo dispositivo.

--------------------------------------------------------------
1) DOPPIO CLIC  ->  RitmoLab-ChromeOS.zip     (sempre possibile)
--------------------------------------------------------------
Estrai lo zip e fai doppio clic su RitmoLab.html.
Funziona su qualunque Chromebook, anche senza Linux attivo.
Per l'icona sulla shelf: nel browser, menu (tre puntini) >
"Altri strumenti" > "Crea collegamento" e spunta "Apri come finestra".

--------------------------------------------------------------
2) APP INSTALLABILE  ->  RitmoLab-ChromeOS-PWA.zip
--------------------------------------------------------------
RitmoLab diventa una vera app con icona sulla shelf.
Serve il Terminale Linux attivo (Impostazioni > Sviluppatori >
Terminale Linux) oppure un computer con Python 3.
Istruzioni complete dentro lo zip, file LEGGIMI.txt.

--------------------------------------------------------------
3) PACCHETTO LINUX  ->  RitmoLab-$VERSION-chromeos.deb
--------------------------------------------------------------
Per Chromebook con Linux attivo. Apre il Terminale Linux
(Impostazioni > Sviluppatori > Terminale Linux) ed esegue:

    sudo dpkg -i RitmoLab-$VERSION-chromeos.deb
    sudo apt-get -f install        # solo se mancano dipendenze

Al termine compare "RitmoLab" nel menu delle app Linux e sulla shelf.

Per disinstallarlo:   sudo apt remove ritmolab

--------------------------------------------------------------
DIMENSIONE
--------------------------------------------------------------
L'app pesa circa $HTML_MB MB e contiene già tutto: audio, grafica,
stili e codice. Non serve Internet, né dopo l'installazione né durante
l'uso. Nessun dato viene inviato all'esterno.
TXT

echo
echo "✅ ChromeOS completato"
ls -lh "$OUT" | tail -n +2
