/**
 * electron/main-packaged.cjs
 *
 * Main process per la versione impacchettata di RitmoLab.
 *
 * Differenze rispetto a `electron/main.cjs`:
 *
 * 1. Serve l'app da uno schema personalizzato `ritmolab://` invece che da
 *    `file://`. Chrome considera `file://` un contesto sicuro, ma Electron
 *    non lo garantisce su tutte le piattaforme: registrando lo schema come
 *    `standard` + `secure` il microfono funziona sempre, perché
 *    `navigator.mediaDevices` esiste solo nei contesti sicuri.
 *
 * 2. Concede esplicitamente il permesso del microfono. Il sistema operativo
 *    mostra comunque la propria richiesta nativa (macOS/Windows), ma senza
 *    questo handler Electron negherebbe la richiesta a livello di Chromium.
 *
 * 3. Gestisce i link esterni: qualsiasi navigazione fuori dall'app viene
 *    aperta nel browser di sistema, per non lasciare mai l'utente davanti a
 *    una finestra senza controlli.
 */

const { app, BrowserWindow, protocol, net, shell, session } = require('electron');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const SCHEME = 'ritmolab';
const APP_ORIGIN = `${SCHEME}://app`;
const ENTRY = `${APP_ORIGIN}/RitmoLab.html`;

/** Percorso della cartella che contiene RitmoLab.html (dentro l'asar). */
const APP_ROOT = path.join(__dirname);

let mainWindow = null;

// Lo schema deve essere registrato PRIMA che l'app sia pronta.
protocol.registerSchemesAsPrivileged([
  {
    scheme: SCHEME,
    privileges: {
      standard: true,
      secure: true, // ← necessario per getUserMedia (microfono)
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true,
    },
  },
]);

/**
 * Converte un URL `ritmolab://app/<percorso>` in un percorso su disco,
 * impedendo qualsiasi tentativo di uscire dalla cartella dell'app.
 */
function resolveRequestPath(requestUrl) {
  const { pathname } = new URL(requestUrl);
  const decoded = decodeURIComponent(pathname);
  const relative = decoded.replace(/^\/+/, '');
  const resolved = path.join(APP_ROOT, relative || 'RitmoLab.html');

  // Protezione contro il path traversal (../..).
  const normalisedRoot = path.resolve(APP_ROOT) + path.sep;
  if (!path.resolve(resolved).startsWith(normalisedRoot)) {
    return path.join(APP_ROOT, 'RitmoLab.html');
  }
  return resolved;
}

function registerProtocolHandler() {
  protocol.handle(SCHEME, (request) => {
    const filePath = resolveRequestPath(request.url);

    // `net.fetch` con URL file:// legge anche dall'interno dell'archivio asar.
    return net.fetch(pathToFileURL(filePath).toString(), {
      headers: request.headers,
    });
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 1024,
    minHeight: 700,
    title: 'RitmoLab — Laboratorio Musicale',
    backgroundColor: '#FFFBEB',
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      autoplayPolicy: 'no-user-gesture-required',
      backgroundThrottling: false,
    },
  });

  // Evita il lampo di finestra bianca all'avvio.
  mainWindow.once('ready-to-show', () => {
    mainWindow.maximize();
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // I link esterni si aprono nel browser di sistema, mai dentro l'app.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith(APP_ORIGIN)) return { action: 'allow' };
    shell.openExternal(url).catch(() => {});
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith(APP_ORIGIN)) {
      event.preventDefault();
      shell.openExternal(url).catch(() => {});
    }
  });

  mainWindow.loadURL(ENTRY);
}

app.whenReady().then(() => {
  registerProtocolHandler();

  // Permesso del microfono: la richiesta nativa del sistema operativo resta.
  const ses = session.defaultSession;
  ses.setPermissionRequestHandler((_webContents, permission, callback) => {
    const allowed = new Set([
      'media',
      'audioCapture',
      'videoCapture',
      'speaker-selection',
    ]);
    callback(allowed.has(permission));
  });
  ses.setPermissionCheckHandler((_webContents, permission) => {
    return (
      permission === 'media' ||
      permission === 'audioCapture' ||
      permission === 'videoCapture'
    );
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
