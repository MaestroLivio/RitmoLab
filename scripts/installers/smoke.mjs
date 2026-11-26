// Smoke test for the actual packaged renderer and its offline assets.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

const browser = process.argv[2] === '--browser';
const binary = browser ? process.argv[3] : process.argv[2] || (process.platform === 'darwin'
  ? '.build/electron/dist/mac-arm64/RitmoLab.app/Contents/MacOS/RitmoLab'
  : '.build/electron/dist/win-unpacked/RitmoLab.exe');
const profile = mkdtempSync(join(tmpdir(), 'ritmolab-smoke-'));
const listener = createServer();
await new Promise(resolve => listener.listen(0, '127.0.0.1', resolve));
const port = listener.address().port;
await new Promise(resolve => listener.close(resolve));
const child = spawn(resolve(binary), [`--remote-debugging-port=${port}`, `--user-data-dir=${profile}`,
  '--disable-background-networking', ...(browser ? ['--headless', '--autoplay-policy=no-user-gesture-required',
    'http://localhost:5173/'] : [])],
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
      return (await response.json()).find(target => target.url.startsWith(browser ? 'http://localhost:5173/' : 'ritmolab://'))?.webSocketDebuggerUrl;
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
  await waitFor(() => js(`!!document.querySelector('.studio-shell')`), 'interfaccia');
  await js(`window.findButton = (match) => [...document.querySelectorAll('button')].find(b => b.innerText.includes(match));
    window.press = (match) => window.findButton(match)?.click();`);
  if (process.platform === 'darwin' && process.env.CI === 'true') {
    // The hosted macOS runner may not expose a physical output device.
    // Keep an actual AudioContext clock, but don't route it to hardware.
    await js(`window.AudioContext = new Proxy(window.AudioContext, {
      construct(target, [options], newTarget) {
        return Reflect.construct(target, [{ ...options, sinkId: { type: 'none' } }], newTarget);
      }
    })`);
  }
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
  await waitFor(() => js(`!!findButton('Strumenti')`), 'barra di lavoro');
  await js(`press('Strumenti')`);
  await waitFor(() => js(`!!document.querySelector('select[aria-label="Tipo di laboratorio"]')`), 'laboratorio');
  await js(`{
    const mode = document.querySelector('select[aria-label="Tipo di laboratorio"]');
    mode.value = 'melody';
    mode.dispatchEvent(new Event('change', { bubbles: true }));
  }`);
  await waitFor(() => js(`!!document.querySelector('.score-paper')`), 'pentagramma');
  await js(`window.score = document.querySelector('.score-area'); score.focus();
    window.key = (key, options = {}) => score.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, ...options }));
    key('Enter');`);
  await waitFor(() => js(`document.querySelectorAll('.score-note-hit').length === 1`), 'inserimento da tastiera');
  const firstLeft = await js(`parseFloat(document.querySelector('.score-note-hit').style.left)`);
  await js(`key('ArrowRight', { shiftKey: true })`);
  await waitFor(() => js(`parseFloat(document.querySelector('.score-note-hit')?.style.left) > ${firstLeft + 1}`), 'spostamento');
  await js(`key('z', { ctrlKey: true })`);
  await waitFor(() => js(`parseFloat(document.querySelector('.score-note-hit')?.style.left) === ${firstLeft}`), 'annulla');
  if (process.env.RITMOLAB_SCREENSHOT) {
    const { data } = await send('Page.captureScreenshot', { format: 'png' });
    writeFileSync(process.env.RITMOLAB_SCREENSHOT, Buffer.from(data, 'base64'));
  }
  await js(`{
    const staff = document.querySelector('select[aria-label="Tipo di rigo"]');
    staff.value = 'dual';
    staff.dispatchEvent(new Event('change', { bubbles: true }));
  }`);
  await waitFor(() => js(`!!document.querySelector('[aria-label="Voci visibili"]')`), 'selettore delle voci');
  await js(`{
    const voices = document.querySelector('[aria-label="Voci visibili"]');
    voices.value = 'both';
    voices.dispatchEvent(new Event('change', { bubbles: true }));
  }`);
  await waitFor(() => js(`document.querySelectorAll('.score-paper > g').length === 2`), 'doppio rigo');
  await js(`{
    const bounds = score.getBoundingClientRect();
    const row = document.querySelector('.score-row-button').getBoundingClientRect().height;
    const first = document.querySelector('.score-note-hit').getBoundingClientRect();
    score.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: first.left + first.width / 2, clientY: bounds.top + row * 11.5 }));
  }`);
  await waitFor(() => js(`document.querySelectorAll('.score-note-hit').length === 2`), 'inserimento sulla seconda voce');

  const viewport = async ([width, height, size]) => {
    await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
    await js(`document.documentElement.style.fontSize = '${size}%'; new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))`);
  };
  const noHorizontalOverflow = () => js(`['.studio-header','.studio-main','.score-toolbar','.score-viewport','.exercise-panel','.studio-dialog']
    .flatMap(selector => [...document.querySelectorAll(selector)])
    .filter(el => el.scrollWidth > el.clientWidth + 2).map(el => [el.className, el.scrollWidth, el.clientWidth])`);
  if (process.env.RITMOLAB_RESPONSIVE === '1') {
    const views = [[1920, 1080, 100], [1366, 768, 115], [1024, 600, 130], [540, 420, 130], [320, 640, 200]];
    for (const view of views) {
      await viewport(view);
      assert.deepEqual(await noHorizontalOverflow(), [], `Debordamento a ${view.join('×')}`);
    }
    await waitFor(() => js(`!document.querySelector('[aria-label="Pagina successiva"]').disabled`), 'due pagine su finestra stretta');
    await js(`document.querySelector('[aria-label="Pagina successiva"]').click()`);
    await waitFor(() => js(`document.querySelector('.score-viewport').innerText.includes('Battuta 2') &&
      document.querySelectorAll('.score-note-hit').length === 0`), 'seconda pagina');
    await js(`document.querySelector('[aria-label="Pagina precedente"]').click()`);
    await waitFor(() => js(`document.querySelectorAll('.score-note-hit').length === 2`), 'ritorno alla prima pagina senza perdere note');
    await js(`document.querySelector('[aria-label="Impostazioni"]').click()`);
    await waitFor(() => js(`!!document.querySelector('.studio-dialog')`), 'impostazioni a caratteri grandi');
    assert.deepEqual(await noHorizontalOverflow(), []);
    await js(`document.querySelectorAll('.studio-dialog details').forEach(section => section.open = true)`);
    assert.deepEqual(await noHorizontalOverflow(), []);
    await js(`document.querySelector('[aria-label="Chiudi impostazioni"]').click()`);
    await js(`press('Verifica')`);
    await waitFor(() => js(`!!document.querySelector('.score-inspector[open]')`), 'verifica in una finestra separata');
    assert.deepEqual(await noHorizontalOverflow(), []);
    await js(`document.querySelector('.score-inspector form button').click()`);
    await waitFor(() => js(`!document.querySelector('.score-inspector')`), 'chiusura della verifica');
    await js(`press('Strumenti')`);
    await js(`{
      const voices = document.querySelector('[aria-label="Voci visibili"]');
      voices.value = 'auto';
      voices.dispatchEvent(new Event('change', { bubbles: true }));
    }`);
    await viewport(views[2]);
    await waitFor(() => js(`document.querySelectorAll('.score-paper > g').length === 1`), 'voce singola automatica su finestra bassa');
    const editorHeight = await js(`{
      const main = document.querySelector('.studio-main');
      [main.scrollHeight, main.clientHeight, innerWidth, innerHeight, document.querySelector('.studio-header').offsetHeight,
      document.querySelector('.studio-shell').offsetHeight, ...[...document.querySelector('.score-editor').children].map(x => [x.className, Math.round(x.getBoundingClientRect().height)])]
    }`);
    if (process.env.RITMOLAB_SCREENSHOT) {
      const { data } = await send('Page.captureScreenshot', { format: 'png' });
      writeFileSync(process.env.RITMOLAB_SCREENSHOT, Buffer.from(data, 'base64'));
    }
    assert.ok(editorHeight[0] <= editorHeight[1] + 2,
      'editor a doppio rigo senza scorrimento a 1024×600 con testo al 130%: ' + JSON.stringify(editorHeight));
    await viewport(views[3]);
    await js(`press('Ascolta')`);
    await waitFor(() => js(`document.querySelector('.score-page-mode').textContent === 'Segue la riproduzione' &&
      document.querySelector('.score-viewport').innerText.includes('Battuta 2')`), 'paginazione durante la riproduzione');
    await js(`press('Ferma')`);
    await viewport(views[2]);
    await js(`document.querySelector('[aria-label^="Elenco livelli"]').click()`);
    await waitFor(() => js(`!!document.querySelector('.level-area-picker')`), 'selezione per aree');
    assert.deepEqual(await noHorizontalOverflow(), []);
  }

  await js(`press('Percorso Didattico')`);
  await waitFor(() => js(`!!findButton('Esegui il Ritmo')`), 'percorso');
  await js(`press('Esegui il Ritmo')`);
  await waitFor(() => js(`!!findButton('Inizia Esercizio')`), 'esercizio');
  if (process.env.RITMOLAB_RESPONSIVE === '1') {
    await viewport([320, 640, 200]);
    assert.deepEqual(await noHorizontalOverflow(), []);
    await viewport([1024, 600, 130]);
  }
  await js(`{
    window.countsSeen = [];
    const observer = new MutationObserver(() => {
      const count = Number(document.querySelector('.count-dial')?.textContent.trim());
      if (count > 0 && window.countsSeen.at(-1) !== count) window.countsSeen.push(count);
    });
    observer.observe(document.body, { subtree: true, childList: true, characterData: true });
    document.querySelector('.backing-toggle input').click();
    press('Inizia Esercizio');
  }`);
  await waitFor(() => js(`window.countsSeen[0] === 4`), 'prima pulsazione del conteggio');
  await waitFor(() => js(`document.querySelector('.lesson-progress')?.value > 0`), 'trasporto dopo il conteggio');
  if (process.env.RITMOLAB_RESPONSIVE === '1') {
    assert.deepEqual(await noHorizontalOverflow(), []);
    assert.ok(await js(`{
      const main = document.querySelector('.studio-main');
      main.scrollHeight <= main.clientHeight + 2
    }`), 'esercizio ritmico senza scorrimento a 1024×600 con testo al 130%');
    await viewport([540, 420, 130]);
    assert.deepEqual(await noHorizontalOverflow(), []);
  }
  await js(`press('Interrompi e torna')`);
  await waitFor(() => js(`!!findButton('Inizia Esercizio') && !document.querySelector('.count-dial')`), 'annullamento');
  if (process.env.RITMOLAB_RESPONSIVE === '1') {
    await viewport([320, 640, 200]);
    await js(`document.querySelector('[aria-label="Strumentario Orff"]').click()`);
    await waitFor(() => js(`!!document.querySelector('[aria-label="Chiudi strumentario"]')`), 'strumentario');
    assert.deepEqual(await noHorizontalOverflow(), []);
    await js(`document.querySelector('[aria-label="Chiudi strumentario"]').click()`);
    await js(`document.querySelector('[aria-label^="Elenco livelli"]').click()`);
    await waitFor(() => js(`!!findButton('Melodia & Solmisazione')`), 'elenco delle aree melodiche');
    assert.deepEqual(await noHorizontalOverflow(), []);
    await js(`press('Melodia & Solmisazione')`);
    await waitFor(() => js(`!!findButton('M1')`), 'primo livello melodico');
    await js(`press('M1')`);
    await waitFor(() => js(`!!document.querySelector('.studio-level-picker') && document.querySelector('.studio-level-picker').innerText.includes('M1')`), 'livello melodico attivo');
    await js(`press('Esegui il Ritmo')`);
    await waitFor(() => js(`!!findButton('Inizia Esercizio') && !!findButton('Modalità Canto')`), 'preparazione melodica');
    assert.deepEqual(await noHorizontalOverflow(), []);
    await js(`window.alert = () => {};
      document.querySelector('[aria-label^="Elenco livelli"]').click();`);
    await waitFor(() => js(`!!findButton('Strumenti Docente')`), 'gestione dei livelli');
    await js(`press('Strumenti Docente')`);
    await waitFor(() => js(`!!findButton('Sblocca Tutti')`), 'gestione docente');
    assert.deepEqual(await noHorizontalOverflow(), []);
    await js(`press('Sblocca Tutti')`);
    await waitFor(() => js(`!document.querySelector('.studio-overlay')`), 'sblocco nel profilo di prova');
    await js(`press('Ritmo & Body Percussion')`);
    await js(`{
      const areas = document.querySelector('.level-area-picker select');
      areas.value = '7'; areas.dispatchEvent(new Event('change', { bubbles:true }));
    }`);
    await waitFor(() => js(`!!findButton('R43')`), 'area dei dettati');
    await js(`press('R43')`);
    await waitFor(() => js(`!!findButton('Ascolta il dettato')`), 'dettato');
    assert.deepEqual(await noHorizontalOverflow(), []);
  }
  assert.deepEqual(errors, []);
  console.log('Smoke test: banco audio/Bravura, editor, conto alla rovescia e interruzione verificati.'
    + (process.env.RITMOLAB_RESPONSIVE === '1' ? ' Verificati anche i layout da 320 a 1920 px.' : ''));
} finally {
  if (child.exitCode == null && child.pid) {
    const exited = new Promise(resolve => child.once('exit', resolve));
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ id: 999999, method: 'Browser.close' }));
      await Promise.race([exited, delay(2000)]);
    }
    if (child.exitCode == null && child.signalCode == null) {
      child.kill();
      await Promise.race([exited, delay(2000)]);
    }
  }
  ws?.close();
  rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
}
