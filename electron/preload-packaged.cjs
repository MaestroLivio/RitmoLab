const { contextBridge } = require('electron');

// API minima esposta alla pagina.
// `__RITMOLAB_VERSION__` viene sostituito da scripts/installers/build-electron.sh
// con la versione reale del pacchetto.
contextBridge.exposeInMainWorld('ritmoLabAPI', {
  platform: process.platform,
  version: '__RITMOLAB_VERSION__',
  packaged: true,
});
