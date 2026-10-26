const { contextBridge, ipcRenderer } = require('electron');

// API minima esposta alla pagina.
// `__RITMOLAB_VERSION__` viene sostituito da scripts/installers/build-electron.sh
// con la versione reale del pacchetto.
contextBridge.exposeInMainWorld('ritmoLabAPI', {
  platform: process.platform,
  version: '__RITMOLAB_VERSION__',
  packaged: true,

  // Auto-aggiornamento (solo nella versione impacchettata).
  updates: {
    // Restituisce { currentVersion, latestVersion, ... } oppure null.
    check: () => ipcRenderer.invoke('ritmolab:update:check'),
    // Scarica e avvia l'installer. Restituisce { ok, error? }.
    install: () => ipcRenderer.invoke('ritmolab:update:install'),
    // Notifica l'avanzamento del download { percent, received, total }.
    onProgress: (callback) => {
      const handler = (_event, payload) => callback(payload);
      ipcRenderer.on('ritmolab:update:progress', handler);
      return () => ipcRenderer.removeListener('ritmolab:update:progress', handler);
    },
  },
});
