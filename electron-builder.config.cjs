/**
 * electron-builder.config.cjs
 *
 * Configurazione di packaging per RitmoLab.
 *
 * Obiettivo: produrre eseguibili AUTONOMI (non launcher che dipendono da un
 * browser esterno). Ogni pacchetto contiene il runtime Electron/Chromium
 * completo, quindi funziona su una macchina priva di Chrome, Edge o altro.
 *
 * Il contenuto dell'app è il file `RitmoLab.html` generato da
 * `scripts/build-standalone-html.js`: un singolo file con CSS e JS inlinati,
 * senza alcuna richiesta di rete.
 */

/** @type {import('electron-builder').Configuration} */
module.exports = {
  appId: 'it.ritmolab.app',
  productName: 'RitmoLab',
  copyright: 'RitmoLab — Laboratorio Musicale per la Scuola Primaria',

  // La cartella `app` viene preparata da scripts/installers/build-electron.sh:
  // contiene main.cjs, preload.cjs, package.json minimale e RitmoLab.html.
  directories: {
    app: '.build/electron/app',
    output: '.build/electron/dist',
    buildResources: '.build/icon',
  },

  // Solo i file dell'app: niente node_modules, niente sorgenti.
  // L'app impacchettata non ha dipendenze runtime: usa solo i moduli nativi
  // di Electron e `node:*`. Escludere node_modules evita di trascinare
  // nell'archivio le dipendenze di sviluppo e di build del progetto.
  files: [
    'main.cjs',
    'preload.cjs',
    'RitmoLab.html',
    'package.json',
    '!node_modules/**',
    '!**/*.map',
  ],

  // L'app impacchettata non ha un package.json con `main`: lo dichiariamo qui.
  extraMetadata: {
    main: 'main.cjs',
    name: 'ritmolab',
    version: '1.0.0',
    // Usato dai desktop Linux per associare la finestra al launcher.
    desktopName: 'RitmoLab.desktop',
  },

  // Nessuna dipendenza runtime: Electron fornisce già tutto.
  npmRebuild: false,
  nodeGypRebuild: false,
  buildDependenciesFromSource: false,

  // `normal` invece di `maximum`: il runtime Chromium pesa ~250 MB e la
  // compressione massima richiede molti minuti per un guadagno minimo.
  compression: 'normal',
  removePackageScripts: true,

  asar: true,
  // Nessun auto-update: l'app è distribuita come installer, non gestita da
  // un server di aggiornamenti. Evita la generazione di ZIP e blockmap.
  generateUpdatesFilesForAllChannels: false,

  // ---------------------------------------------------------------- macOS ---
  mac: {
    category: 'public.app-category.education',
    target: [
      { target: 'dmg', arch: ['arm64', 'x64'] },
    ],
    icon: '.build/icon/icon-1024.png',
    artifactName: '${productName}-${version}-macOS-${arch}.${ext}',
    darkModeSupport: true,
    hardenedRuntime: false,
    gatekeeperAssess: false,
    identity: null, // firma ad-hoc, nessun certificato richiesto
    extendInfo: {
      NSMicrophoneUsageDescription:
        'RitmoLab usa il microfono per verificare l\'intonazione negli esercizi di canto.',
      NSCameraUsageDescription:
        'RitmoLab usa la fotocamera solo se richiesto dagli esercizi.',
      LSMinimumSystemVersion: '10.15',
      NSHighResolutionCapable: true,
    },
  },

  dmg: {
    title: 'RitmoLab ${version}',
    icon: '.build/icon/icon-1024.png',
    background: null,
    window: { width: 560, height: 380 },
    contents: [
      { x: 150, y: 190, type: 'file' },
      { x: 410, y: 190, type: 'link', path: '/Applications' },
    ],
  },

  // -------------------------------------------------------------- Windows ---
  win: {
    target: [
      { target: 'nsis', arch: ['x64'] },
      { target: 'portable', arch: ['x64'] },
    ],
    icon: '.build/icon/icon.ico',
    artifactName: '${productName}-${version}-Windows-${arch}.${ext}',
  },

  nsis: {
    oneClick: false,
    perMachine: false,
    allowToChangeInstallationDirectory: true,
    allowElevation: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: 'RitmoLab',
    installerLanguages: ['it_IT'],
    language: '1036', // italiano
    license: 'LICENSE',
    deleteAppDataOnUninstall: false,
    runAfterFinish: true,
    installerIcon: '.build/icon/icon.ico',
    uninstallerIcon: '.build/icon/icon.ico',
  },

  portable: {
    artifactName: '${productName}-${version}-Windows-Portable.${ext}',
  },

  // --------------------------------------------------------------- Linux ----
  linux: {
    target: [
      { target: 'AppImage', arch: ['x64'] },
      { target: 'deb', arch: ['x64'] },
    ],
    category: 'Education',
    icon: '.build/icon/icon-512.png',
    maintainer: 'MaestroLivio <maestrolivio@users.noreply.github.com>',
    // Allinea il nome del file .desktop a `extraMetadata.desktopName`, così il
    // desktop environment associa la finestra al launcher in modo affidabile.
    syncDesktopName: true,
    synopsis: 'Laboratorio musicale per la scuola primaria',
    description:
      'RitmoLab unisce body percussion, strumentario Orff e solmisazione relativa ' +
      'con chironomia Kodály in un laboratorio offline per la scuola primaria.',
    desktop: {
      entry: {
        Name: 'RitmoLab',
        Comment: 'Laboratorio musicale per la scuola primaria',
        Categories: 'Education;AudioVideo;Music;',
        Keywords: 'musica;ritmo;solfeggio;scuola;primaria;orff;kodaly;',
      },
    },
  },

  appImage: {
    artifactName: '${productName}-${version}-Linux-${arch}.${ext}',
  },

  deb: {
    artifactName: '${productName}-${version}-Linux-${arch}.${ext}',
    depends: [
      'libgtk-3-0',
      'libnotify4',
      'libnss3',
      'libxss1',
      'libxtst6',
      'xdg-utils',
      'libatspi2.0-0',
      'libuuid1',
      'libsecret-1-0',
    ],
  },
};
