// Smoke test for the actual packaged renderer and its offline assets.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

const binary = process.argv[2] || (process.platform === 'darwin'
  ? '.build/electron/dist/mac-arm64/RitmoLab.app/Contents/MacOS/RitmoLab'
  : '.build/electron/dist/win-unpacked/RitmoLab.exe');
const profile = mkdtempSync(join(tmpdir(), 'ritmolab-smoke-'));
const listener = createServer();
await new Promise(resolve => listener.listen(0, '127.0.0.1', resolve));
const port = listener.address().port;
await new Promise(resolve => listener.close(resolve));
const child = spawn(resolve(binary), [`--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, '--disable-background-networking'],
  { stdio: ['ignore', 'ignore', 'inherit'] });
child.on('error', error => console.error(error));

async function waitFor(check, description, timeout = 15_000) {
  const end = Date.now() + timeout;
  do {
    const result = await check();
    if (result) return result;
    await delay(100);
  } while (Date.now() < end);
  throw new Error(`Non verificato: ${description}`);
}

let ws;
try {
  const endpoint = await waitFor(async () => {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/list`);
      return (await response.json()).find(target => target.url.startsWith('ritmolab://'))?.webSocketDebuggerUrl;
    } catch { return null; }
  }, 'avvio dell’app impacchettata');
  ws = new WebSocket(endpoint);
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve, { once: true });
    ws.addEventListener('error', reject, { once: true });
  });
  let id = 0;
  const pending = new Map();
  const errors = [];
  ws.addEventListener('message', ({ data }) => {
    const message = JSON.parse(data);
    if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails);
    if (message.id == null) return;
    pending.get(message.id)?.(message);
    pending.delete(message.id);
  });
  const send = (method, params) => new Promise((resolve, reject) => {
    pending.set(++id, response => response.error ? reject(response.error) : resolve(response.result));
    ws.send(JSON.stringify({ id, method, params }));
  });
  const js = async expression => {
    const response = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (response.exceptionDetails) throw new Error(response.exceptionDetails.exception?.description || response.exceptionDetails.text);
    return response.result.value;
  };
  await send('Runtime.enable');
  await js(`window.findButton = (match) => [...document.querySelectorAll('button')].find(b => b.innerText.includes(match));
    window.press = (match) => window.findButton(match)?.click();`);
  const scripts = await waitFor(() => js(`document.querySelector('.studio-shell') && !!findButton('Laboratorio Libero')`), 'interfaccia');
  assert.ok(scripts);
  const assets = JSON.stringify(['samples/clap.mp3', 'samples/triangle.mp3', 'samples/flute-60.mp3',
    'samples/piano-60.mp3', 'fonts/Bravura.woff2']);
  assert.ok(await js(`(async () => {
    const context = new AudioContext();
    for (const path of ${assets}) {
      const file = await fetch(path);
      if (!file.ok) return false;
      if (path.endsWith('mp3')) {
        const sample = await context.decodeAudioData(await file.arrayBuffer());
        if (!sample.length || !sample.getChannelData(0).some(value => Math.abs(value) > 0.005)) return false;
      }
    }
    await context.close();
    return true;
  })()`));
  assert.ok(await js(`document.fonts.load('40px Bravura', '\\uE050').then(fonts => fonts.length > 0)`));

  await js(`press('Laboratorio Libero')`);
  await waitFor(() => js(`!!findButton('Rigo Melodico')`), 'laboratorio');
  await js(`press('Rigo Melodico')`);
  await waitFor(() => js(`!!document.querySelector('.score-paper')`), 'pentagramma');
  await js(`window.score = document.querySelector('.score-area'); score.focus();
    window.key = (key, options = {}) => score.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, ...options }));
    key('Enter');`);
  await waitFor(() => js(`document.querySelectorAll('.score-note-hit').length === 1`), 'inserimento da tastiera');
  await js(`key('ArrowRight', { shiftKey: true })`);
  await waitFor(() => js(`document.querySelector('.score-note-hit')?.style.left === '118px'`), 'spostamento');
  await js(`key('z', { ctrlKey: true })`);
  await waitFor(() => js(`document.querySelector('.score-note-hit')?.style.left === '86px'`), 'annulla');
  if (process.env.RITMOLAB_SCREENSHOT) {
    const { data } = await send('Page.captureScreenshot', { format: 'png' });
    writeFileSync(process.env.RITMOLAB_SCREENSHOT, Buffer.from(data, 'base64'));
  }
  await js(`{
    const staff = document.querySelector('select[aria-label="Tipo di rigo"]');
    staff.value = 'dual';
    staff.dispatchEvent(new Event('change', { bubbles: true }));
  }`);
  await waitFor(() => js(`document.querySelectorAll('.score-paper > g').length === 2`), 'doppio rigo');
  await js(`{
    const bounds = score.getBoundingClientRect();
    score.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: bounds.left + 103, clientY: bounds.top + 184 }));
  }`);
  await waitFor(() => js(`document.querySelectorAll('.score-note-hit').length === 2`), 'inserimento sulla seconda voce');

  await js(`press('Percorso Didattico')`);
  await waitFor(() => js(`!!findButton('Esegui il Ritmo')`), 'percorso');
  await js(`press('Esegui il Ritmo')`);
  await waitFor(() => js(`!!findButton('Inizia Esercizio')`), 'esercizio');
  await js(`document.querySelector('.backing-toggle input').click(); press('Inizia Esercizio')`);
  await waitFor(() => js(`document.querySelector('.count-dial')?.textContent.trim() === '4'`), 'prima pulsazione del conteggio');
  await waitFor(() => js(`document.querySelector('.lesson-progress')?.value > 0`), 'trasporto dopo il conteggio');
  await js(`press('Interrompi e torna')`);
  await waitFor(() => js(`!!findButton('Inizia Esercizio') && !document.querySelector('.count-dial')`), 'annullamento');
  assert.deepEqual(errors, []);
  console.log('Smoke test: banco audio/Bravura, editor, conto alla rovescia e interruzione verificati.');
} finally {
  ws?.close();
  if (child.exitCode == null && child.pid) {
    const exited = new Promise(resolve => child.once('exit', resolve));
    child.kill();
    await Promise.race([exited, delay(2000)]);
  }
  rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
}
