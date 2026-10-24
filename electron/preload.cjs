const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('ritmoLabAPI', {
  platform: process.platform,
  version: '1.0.0',
});
