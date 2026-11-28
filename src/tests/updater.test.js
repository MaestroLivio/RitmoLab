import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { EventEmitter } from 'node:events';
import path from 'node:path';

const require = createRequire(import.meta.url);
const Module = require('node:module');

test('updater handles Electron Session.downloadURL returning void', async () => {
  const oldPlatform = Object.getOwnPropertyDescriptor(process, 'platform');
  const oldArch = Object.getOwnPropertyDescriptor(process, 'arch');
  Object.defineProperty(process, 'platform', { value: 'darwin' });
  Object.defineProperty(process, 'arch', { value: 'arm64' });

  const handlers = new Map();
  const app = new EventEmitter();
  app.getVersion = () => '1.2.1';
  app.getPath = () => '/tmp';
  app.quit = () => {};

  const item = new EventEmitter();
  item.setSavePath = filePath => { item.savePath = filePath; };
  item.getTotalBytes = () => 100;
  item.getReceivedBytes = () => 100;

  const downloadSession = new EventEmitter();
  downloadSession.downloadURL = url => {
    assert.equal(url, 'https://example.test/RitmoLab-1.3.0-macOS-arm64.dmg');
    // Electron's API returns undefined; it reports completion via events.
    queueMicrotask(() => {
      downloadSession.emit('will-download', {}, item);
      queueMicrotask(() => item.emit('done', {}, 'completed'));
    });
  };

  const electron = {
    app,
    ipcMain: { handle: (channel, handler) => handlers.set(channel, handler) },
    net: {
      fetch: async () => ({
        ok: true,
        json: async () => ({
          tag_name: 'v1.3.0',
          assets: [{
            name: 'RitmoLab-1.3.0-macOS-arm64.dmg',
            browser_download_url: 'https://example.test/RitmoLab-1.3.0-macOS-arm64.dmg',
            size: 100,
          }],
        }),
      }),
    },
    session: { defaultSession: downloadSession },
    shell: { openPath: async () => '' },
  };
  const modulePath = require.resolve('../../electron/updater.cjs');
  const originalLoad = Module._load;

  try {
    Module._load = function (request, parent, isMain) {
      if (request === 'electron') return electron;
      return originalLoad.call(this, request, parent, isMain);
    };
    delete require.cache[modulePath];
    const updater = require(modulePath);
    updater.init(() => null);

    const update = await handlers.get(updater.IPC.CHECK)();
    assert.equal(update.latestVersion, '1.3.0');

    const result = await handlers.get(updater.IPC.INSTALL)();
    assert.deepEqual(result, {
      ok: true,
      filePath: path.join('/tmp', 'RitmoLab-1.3.0-macOS-arm64.dmg'),
    });
    assert.equal(item.savePath, result.filePath);
  } finally {
    Module._load = originalLoad;
    delete require.cache[modulePath];
    Object.defineProperty(process, 'platform', oldPlatform);
    Object.defineProperty(process, 'arch', oldArch);
  }
});
