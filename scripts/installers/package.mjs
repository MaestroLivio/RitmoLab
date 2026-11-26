import { spawnSync } from 'node:child_process';
import { copyFileSync, cpSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../..', import.meta.url));
const platform = process.argv[2] || { darwin: 'macos', win32: 'windows' }[process.platform];
const args = { macos: ['--mac', '--arm64'], windows: ['--win', '--x64'] }[platform];
if (!Array.isArray(args)) throw new Error('Scegli macos (arm64) o windows (x64).');
const app = join(root, '.build/electron/app');
const output = join(root, '.build/electron/dist');
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const run = (script, ...options) => {
  const child = spawnSync(process.execPath, [join(root, script), ...options], { cwd: root, stdio: 'inherit' });
  if (child.status !== 0) throw child.error || new Error(`${script}: uscita ${child.status}`);
};

run('node_modules/vite/bin/vite.js', 'build');
mkdirSync(app, { recursive: true });
for (const dir of ['assets', 'samples', 'fonts']) {
  cpSync(join(root, 'dist', dir), join(app, dir), { recursive: true });
}
copyFileSync(join(root, 'dist/index.html'), join(app, 'RitmoLab.html'));
copyFileSync(join(root, 'LICENSE'), join(app, 'LICENSE'));
copyFileSync(join(root, 'electron/main-packaged.cjs'), join(app, 'main.cjs'));
copyFileSync(join(root, 'electron/updater.cjs'), join(app, 'updater.cjs'));
writeFileSync(join(app, 'preload.cjs'), readFileSync(join(root, 'electron/preload-packaged.cjs'), 'utf8')
  .replaceAll('__RITMOLAB_VERSION__', pkg.version));
writeFileSync(join(app, 'package.json'), JSON.stringify({
  name: pkg.name, version: pkg.version, description: pkg.description, main: 'main.cjs',
  author: pkg.author, license: pkg.license, private: true,
}));
mkdirSync(join(root, '.build/icon'), { recursive: true });
run('scripts/installers/make-icons.mjs', join(root, '.build/icon'));
run('node_modules/electron-builder/cli.js', ...args, '--config', 'electron-builder.config.cjs', '--publish', 'never');
const artifact = `RitmoLab-${pkg.version}-${platform === 'macos' ? 'macOS-arm64.dmg' : 'Windows-x64.exe'}`;
const destination = join(root, 'installers', platform === 'macos' ? 'macOS' : 'Windows');
mkdirSync(destination, { recursive: true });
copyFileSync(join(output, artifact), join(destination, artifact));
