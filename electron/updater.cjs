/**
 * electron/updater.cjs
 *
 * Auto-aggiornamento della versione impacchettata (Electron) di RitmoLab.
 *
 * All'avvio interroga l'API pubblica di GitHub per l'ultima release del
 * repository `MaestroLivio/RitmoLab`. Se esiste una versione più recente di
 * quella in esecuzione, notifica il renderer; su conferma scarica l'installer
 * adatto alla piattaforma e lo avvia (poi chiude l'app).
 *
 * Tutto è volontariamente non bloccante e silenzioso in caso di errore:
 * RitmoLab è offline-first e l'assenza di rete non deve mai impedire l'avvio.
 */

const { app, ipcMain, net, session, shell } = require('electron');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const REPO = 'MaestroLivio/RitmoLab';
const RELEASES_URL = `https://api.github.com/repos/${REPO}/releases/latest`;
const USER_AGENT = 'RitmoLab-Updater';
const CHECK_TIMEOUT_MS = 10000;

const IPC = {
  CHECK: 'ritmolab:update:check',
  INSTALL: 'ritmolab:update:install',
  PROGRESS: 'ritmolab:update:progress',
};

let mainWindowRef = null;
let latestInfo = null;

/** Rimuove il prefisso "v" e gli eventuali suffissi di pre-release. */
function normalizeVersion(value) {
  return String(value || '')
    .trim()
    .replace(/^v/i, '')
    .split('-')[0];
}

/** Confronto semantico: restituisce 1, 0 oppure -1. */
function compareVersions(a, b) {
  const pa = normalizeVersion(a).split('.').map((n) => parseInt(n, 10) || 0);
  const pb = normalizeVersion(b).split('.').map((n) => parseInt(n, 10) || 0);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i += 1) {
    const x = pa[i] || 0;
    const y = pb[i] || 0;
    if (x !== y) return x > y ? 1 : -1;
  }
  return 0;
}

/** Sceglie l'asset della release adatto alla piattaforma in esecuzione. */
function pickAsset(assets, version) {
  const platform = process.platform; // 'darwin' | 'win32' | 'linux'
  const arch = process.arch; // 'arm64' | 'x64'
  const candidates = [];

  if (platform === 'darwin') {
    candidates.push(`RitmoLab-${version}-macOS-${arch}.dmg`);
    // Fallback: l'altra architettura (es. Rosetta 2 sui Mac Apple Silicon).
    if (arch === 'arm64') candidates.push(`RitmoLab-${version}-macOS-x64.dmg`);
    if (arch === 'x64') candidates.push(`RitmoLab-${version}-macOS-arm64.dmg`);
  } else if (platform === 'win32') {
    candidates.push(`RitmoLab-${version}-Windows-x64.exe`);
  } else if (platform === 'linux') {
    // electron-builder nomina l'AppImage `...-x86_64.AppImage` e il deb
    // `...-amd64.deb`, mentre process.arch restituisce `x64`. Preferiamo
    // l'AppImage (avvio senza privilegi) e usiamo il deb come fallback.
    candidates.push(`RitmoLab-${version}-Linux-x86_64.AppImage`);
    candidates.push(`RitmoLab-${version}-Linux-${arch}.AppImage`);
    candidates.push(`RitmoLab-${version}-Linux-amd64.deb`);
  }

  for (const name of candidates) {
    const found = assets.find((a) => a && a.name === name);
    if (found && found.browser_download_url) return found;
  }
  return null;
}

/** Interroga l'ultima release GitHub; null in caso di errore o offline. */
async function fetchLatestRelease() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CHECK_TIMEOUT_MS);
  try {
    const res = await net.fetch(RELEASES_URL, {
      headers: {
        Accept: 'application/vnd.github+json',
        'User-Agent': USER_AGENT,
      },
      signal: controller.signal,
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function getCurrentVersion() {
  try {
    return app.getVersion();
  } catch (err) {
    return '0.0.0';
  }
}

/** Verifica se è disponibile un aggiornamento. Restituisce null se non serve. */
async function checkForUpdates() {
  const release = await fetchLatestRelease();
  if (!release || !release.tag_name || !Array.isArray(release.assets)) return null;

  const latestVersion = normalizeVersion(release.tag_name);
  const currentVersion = normalizeVersion(getCurrentVersion());
  if (!latestVersion || compareVersions(latestVersion, currentVersion) <= 0) return null;

  const asset = pickAsset(release.assets, latestVersion);
  if (!asset) return null;

  latestInfo = {
    currentVersion,
    latestVersion,
    tagName: release.tag_name,
    assetName: asset.name,
    url: asset.browser_download_url,
    size: asset.size || 0,
  };
  return latestInfo;
}

function sendToRenderer(channel, payload) {
  if (mainWindowRef && !mainWindowRef.isDestroyed()) {
    mainWindowRef.webContents.send(channel, payload);
  }
}

/** Scarica l'installer e, al termine, lo avvia e chiude l'app. */
function downloadAndInstall() {
  if (!latestInfo) {
    return Promise.reject(new Error('Nessun aggiornamento disponibile.'));
  }

  const targetPath = path.join(app.getPath('downloads'), latestInfo.assetName);

  return new Promise((resolve, reject) => {
    const ses = session.defaultSession;

    const onWillDownload = (event, item) => {
      // Il listener è per-sessione: rimuovilo subito per evitare leak.
      ses.removeListener('will-download', onWillDownload);

      item.setSavePath(targetPath);

      item.on('updated', (_e, state) => {
        if (state === 'interrupted') {
          reject(new Error('Download interrotto.'));
        } else if (state === 'progressing') {
          const total = item.getTotalBytes();
          const received = item.getReceivedBytes();
          const percent = total > 0 ? Math.round((received / total) * 100) : 0;
          sendToRenderer(IPC.PROGRESS, { percent, received, total });
        }
      });

      item.once('done', (_e, state) => {
        if (state === 'completed') {
          resolve(targetPath);
        } else {
          reject(new Error(`Download non completato (${state}).`));
        }
      });
    };

    ses.on('will-download', onWillDownload);
    ses.downloadURL(latestInfo.url).catch((err) => {
      ses.removeListener('will-download', onWillDownload);
      reject(err);
    });
  });
}

/** Avvia l'installer scaricato e chiude l'app dopo un breve ritardo. */
function launchInstaller(filePath) {
  try {
    if (process.platform === 'linux') {
      // Le AppImage richiedono il bit eseguibile.
      fs.chmodSync(filePath, 0o755);
      spawn(filePath, [], { detached: true, stdio: 'ignore' }).unref();
    } else if (process.platform === 'darwin') {
      // Apre il DMG nel Finder: l'utente trascina RitmoLab in Applicazioni.
      shell.openPath(filePath).catch(() => {});
    } else {
      // Windows: esegue l'installer NSIS.
      spawn(filePath, [], { detached: true, stdio: 'ignore' }).unref();
    }
  } catch (err) {
    // Fallback: apri con l'applicazione predefinita del sistema.
    shell.openPath(filePath).catch(() => {});
  }

  // Lascia il tempo all'installer di avviarsi prima di chiudere l'app.
  setTimeout(() => app.quit(), 800);
}

function registerIpc() {
  ipcMain.handle(IPC.CHECK, async () => checkForUpdates());

  ipcMain.handle(IPC.INSTALL, async () => {
    try {
      const filePath = await downloadAndInstall();
      launchInstaller(filePath);
      return { ok: true, filePath };
    } catch (err) {
      const message = (err && err.message) || String(err);
      return { ok: false, error: message };
    }
  });
}

/**
 * Inizializza l'auto-aggiornamento. `getWindow` restituisce la BrowserWindow
 * principale, usata per inviare gli eventi di avanzamento al renderer.
 */
function init(getWindow) {
  if (typeof getWindow === 'function') {
    const refresh = () => {
      mainWindowRef = getWindow();
    };
    refresh();
    // La finestra può essere ricreata (es. riattivazione su macOS).
    if (app && app.on) {
      app.on('browser-window-created', refresh);
    }
  }
  registerIpc();
}

module.exports = { init, checkForUpdates, IPC };
