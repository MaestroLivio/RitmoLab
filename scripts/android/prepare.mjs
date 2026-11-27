import { cp, mkdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const source = path.join(root, 'dist');
const androidRoot = process.env.RITMOLAB_ANDROID_ROOT || path.join(root, 'android');
const destination = path.join(androidRoot, 'app/src/main/assets');

await mkdir(destination, { recursive: true });
await rm(destination, { recursive: true, force: true });
await mkdir(destination, { recursive: true });
await cp(source, destination, {
  recursive: true,
  filter: sourcePath => {
    const name = path.basename(sourcePath);
    return name !== '.DS_Store' && !name.startsWith('._');
  },
});
console.log(`RitmoLab web build copied into ${path.relative(root, destination)}.`);
