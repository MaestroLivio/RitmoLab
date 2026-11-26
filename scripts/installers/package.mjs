import { spawnSync } from 'node:child_process';
import { copyFileSync, cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../..', import.meta.url));
const platform = process.argv[2] || { darwin: 'macos', win32: 'windows' }[process.platform];
const args = { macos: ['--mac', '--arm64'], windows: ['--win', '--x64'] }[platform];
if (!Array.isArray(args)) throw new Error('Scegli macos (arm64) o windows (x64).');
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const electron = JSON.parse(readFileSync(join(root, 'node_modules/electron/package.json'), 'utf8'));
const run = (cwd, script, ...options) => {
  const child = spawnSync(process.execPath, [join(root, script), ...options], { cwd, stdio: 'inherit' });
  if (child.status !== 0) throw child.error || new Error(`${script}: uscita ${child.status}`);
};

run(root, 'node_modules/vite/bin/vite.js', 'build');
// A fresh, native temp volume also keeps macOS AppleDouble metadata on exFAT
// out of Electron's ASAR integrity scan.
const stage = mkdtempSync(join(tmpdir(), 'ritmolab-package-'));
try {
  const app = join(stage, '.build/electron/app');
  const output = join(stage, '.build/electron/dist');
  mkdirSync(app, { recursive: true });
  for (const dir of ['assets', 'samples', 'fonts']) {
    cpSync(join(root, 'dist', dir), join(app, dir), { recursive: true });
  }
  copyFileSync(join(root, 'dist/index.html'), join(app, 'RitmoLab.html'));
  copyFileSync(join(root, 'LICENSE'), join(app, 'LICENSE'));
  copyFileSync(join(root, 'LICENSE'), join(stage, 'LICENSE.txt'));
  copyFileSync(join(root, 'electron/main-packaged.cjs'), join(app, 'main.cjs'));
  copyFileSync(join(root, 'electron/updater.cjs'), join(app, 'updater.cjs'));
  writeFileSync(join(stage, 'electron-builder.config.cjs'),
    readFileSync(join(root, 'electron-builder.config.cjs'), 'utf8')
      + `\nmodule.exports.electronVersion = ${JSON.stringify(electron.version)};\n`);
  writeFileSync(join(app, 'preload.cjs'), readFileSync(join(root, 'electron/preload-packaged.cjs'), 'utf8')
    .replaceAll('__RITMOLAB_VERSION__', pkg.version));
  const metadata = {
    name: pkg.name, version: pkg.version, description: pkg.description, main: 'main.cjs',
    author: pkg.author, license: pkg.license, private: true,
  };
  writeFileSync(join(app, 'package.json'), JSON.stringify(metadata));
  writeFileSync(join(stage, 'package.json'), JSON.stringify({ ...metadata, devDependencies: { electron: electron.version } }));
  mkdirSync(join(stage, '.build/icon'), { recursive: true });
  run(stage, 'scripts/installers/make-icons.mjs', join(stage, '.build/icon'));
  run(stage, 'node_modules/electron-builder/cli.js', ...args, '--config', 'electron-builder.config.cjs', '--publish', 'never');
  if (process.argv.includes('--smoke')) {
    const binary = platform === 'macos' ? 'mac-arm64/RitmoLab.app/Contents/MacOS/RitmoLab' : 'win-unpacked/RitmoLab.exe';
    run(stage, 'scripts/installers/smoke.mjs', join(output, binary));
  }
  const artifact = `RitmoLab-${pkg.version}-${platform === 'macos' ? 'macOS-arm64.dmg' : 'Windows-x64.exe'}`;
  const destination = join(root, 'installers', platform === 'macos' ? 'macOS' : 'Windows');
  mkdirSync(destination, { recursive: true });
  copyFileSync(join(output, artifact), join(destination, artifact));
} finally {
  rmSync(stage, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 });
}
