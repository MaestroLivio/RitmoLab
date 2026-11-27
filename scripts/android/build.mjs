import { cp, mkdir, mkdtemp, rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import os from 'node:os';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const stagingParent = await mkdtemp(path.join(os.tmpdir(), 'ritmolab-android-'));
const androidRoot = path.join(stagingParent, 'android');
const artifactDir = path.join(root, 'installers', 'Android');
const version = process.env.npm_package_version || '1.2.1';

try {
  execFileSync('npm', ['run', 'build'], { cwd: root, stdio: 'inherit' });
  await cp(path.join(root, 'android'), androidRoot, {
    recursive: true,
    filter: sourcePath => {
      const name = path.basename(sourcePath);
      return name !== '.DS_Store' && !name.startsWith('._') &&
        name !== 'build' && name !== '.gradle' && name !== 'assets';
    },
  });

  execFileSync(process.execPath, ['scripts/android/prepare.mjs'], {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, RITMOLAB_ANDROID_ROOT: androidRoot },
  });

  const sdk = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT ||
    path.join(os.homedir(), 'Library', 'Android', 'sdk');
  const apkEnv = {
    ...process.env,
    ANDROID_HOME: sdk,
    ANDROID_SDK_ROOT: process.env.ANDROID_SDK_ROOT || sdk,
  };
  execFileSync(path.join(androidRoot, 'gradlew'), ['-p', androidRoot, 'assembleDebug'], {
    cwd: androidRoot,
    stdio: 'inherit',
    env: apkEnv,
  });

  const builtApk = path.join(androidRoot, 'app/build/outputs/apk/debug/app-debug.apk');
  const outputApk = path.join(artifactDir, `RitmoLab-${version}-Android-debug.apk`);
  await mkdir(artifactDir, { recursive: true });
  await cp(builtApk, outputApk);
  console.log(`APK installabile: ${path.relative(root, outputApk)}`);
} finally {
  await rm(stagingParent, { recursive: true, force: true });
}
