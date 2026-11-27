import { cp, mkdir, mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import os from 'node:os';
import path from 'node:path';
import { readdirSync } from 'node:fs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const stagingParent = await mkdtemp(path.join(os.tmpdir(), 'ritmolab-android-'));
const androidRoot = path.join(stagingParent, 'android');
const artifactDir = path.join(root, 'installers', 'Android');
const version = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8')).version;
const debug = process.argv.includes('--debug');
const keyAlias = process.env.ANDROID_RELEASE_KEY_ALIAS || 'ritmolab-release';
const localKeystore = path.join(os.homedir(), 'Library', 'Application Support',
  'RitmoLab', 'android-release.jks');
const keychainValue = service => {
  if (process.platform !== 'darwin') return undefined;
  try {
    return execFileSync('security', ['find-generic-password', '-a',
      os.userInfo().username, '-s', service, '-w'], { encoding: 'utf8' }).trim();
  } catch {
    return undefined;
  }
};
const signingEnv = {
  ANDROID_RELEASE_KEYSTORE: process.env.ANDROID_RELEASE_KEYSTORE || localKeystore,
  ANDROID_RELEASE_KEYSTORE_PASSWORD: process.env.ANDROID_RELEASE_KEYSTORE_PASSWORD ||
    keychainValue('RitmoLab Android Release Keystore'),
  ANDROID_RELEASE_KEY_ALIAS: keyAlias,
  ANDROID_RELEASE_KEY_PASSWORD: process.env.ANDROID_RELEASE_KEY_PASSWORD ||
    keychainValue('RitmoLab Android Release Key'),
};

try {
  if (!debug) {
    const missing = Object.entries(signingEnv)
      .filter(([, value]) => !value)
      .map(([name]) => name);
    if (missing.length) {
      throw new Error(`Firma release non configurata: ${missing.join(', ')}. ` +
        'Configura le variabili d’ambiente o il Portachiavi macOS.');
    }
    await stat(signingEnv.ANDROID_RELEASE_KEYSTORE);
  }

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
    ...(!debug ? signingEnv : {}),
  };
  const variant = debug ? 'debug' : 'release';
  const gradleTask = `assemble${variant[0].toUpperCase()}${variant.slice(1)}`;
  execFileSync(path.join(androidRoot, 'gradlew'), ['-p', androidRoot, gradleTask], {
    cwd: androidRoot,
    stdio: 'inherit',
    env: apkEnv,
  });

  const builtApk = path.join(androidRoot, `app/build/outputs/apk/${variant}/app-${variant}.apk`);
  const outputApk = path.join(artifactDir,
    `RitmoLab-${version}-Android${debug ? '-debug' : ''}.apk`);
  if (!debug) {
    const buildTools = readdirSync(path.join(sdk, 'build-tools'))
      .filter(name => /^\d/.test(name)).sort((a, b) => b.localeCompare(a, undefined, { numeric: true }))[0];
    if (!buildTools) throw new Error('Android build-tools non trovati nell’SDK.');
    const tools = path.join(sdk, 'build-tools', buildTools);
    execFileSync(path.join(tools, 'zipalign'), ['-c', '4', builtApk], { stdio: 'inherit' });
    const verification = execFileSync(path.join(tools, 'apksigner'),
      ['verify', '--verbose', '--print-certs', builtApk], { encoding: 'utf8' });
    for (const scheme of ['v1', 'v2', 'v3']) {
      if (!new RegExp(`Verified using ${scheme} scheme.*: true`).test(verification)) {
        throw new Error(`APK release privo di firma verificata ${scheme}.`);
      }
    }
    console.log('APK release firmato e verificato con gli schemi v1/v2/v3.');
  }
  await mkdir(artifactDir, { recursive: true });
  await cp(builtApk, outputApk);
  console.log(`APK installabile: ${path.relative(root, outputApk)}`);
} finally {
  await rm(stagingParent, { recursive: true, force: true });
}
