module.exports = {
  appId: 'it.ritmolab.app',
  productName: 'RitmoLab',
  directories: { app: '.build/electron/app', output: '.build/electron/dist', buildResources: '.build/icon' },
  files: ['**/*', '!**/*.map', '!**/._*'],
  npmRebuild: false,
  mac: {
    category: 'public.app-category.education',
    target: [{ target: 'dmg', arch: ['arm64'] }],
    icon: '.build/icon/icon-1024.png',
    artifactName: '${productName}-${version}-macOS-${arch}.${ext}',
    identity: '-',
    hardenedRuntime: false,
    notarize: false,
    extendInfo: {
      NSMicrophoneUsageDescription: "RitmoLab usa il microfono per gli esercizi di intonazione.",
    },
  },
  dmg: {
    writeUpdateInfo: false,
    contents: [
      { x: 150, y: 190, type: 'file' },
      { x: 410, y: 190, type: 'link', path: '/Applications' },
    ],
  },
  win: {
    target: [{ target: 'nsis', arch: ['x64'] }],
    icon: '.build/icon/icon.ico',
    artifactName: '${productName}-${version}-Windows-${arch}.${ext}',
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true,
    installerLanguages: ['it_IT'],
    differentialPackage: false,
    license: 'LICENSE.txt',
  },
};
