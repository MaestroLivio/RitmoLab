import { settingsManager } from './SettingsManager.js';
import { backingHarmony, createTimeline, toMidi } from './Transport.js';

export const SOLFEGE_MAP = Object.fromEntries([
  ['DO', 'C4', 'Do', '#EF4444', '✊'], ['RE', 'D4', 'Re', '#F97316', '✋'],
  ['MI', 'E4', 'Mi', '#FBBF24', '🫱'], ['FA', 'F4', 'Fa', '#10B981', '👎'],
  ['SOL', 'G4', 'Sol', '#3B82F6', '👋'], ['LA', 'A4', 'La', '#6366F1', '🤏'],
  ['SI', 'B4', 'Si', '#EC4899', '☝️'], ['DO_HIGH', 'C5', 'Do²', '#EF4444', '✊'],
  ['RE_HIGH', 'D5', 'Re²', '#F97316', '✋'], ['MI_HIGH', 'E5', 'Mi²', '#FBBF24', '🫱'],
  ['FA_HIGH', 'F5', 'Fa²', '#10B981', '👎'],
].map(([key, note, label, color, handSign]) => [key, { note, label, color, handSign, syllable: label.replace('²', '') }]));

export const NOTE_FREQUENCIES = Object.fromEntries([3, 4, 5].flatMap(octave =>
  [...'CDEFGAB'].map(letter => {
    const name = `${letter}${octave}`;
    return [name, 440 * 2 ** ((toMidi(name) - 69) / 12)];
  })));

const DRUMS = ['clap', 'chest', 'thighs', 'feet', 'snap', 'claves', 'tambourine',
  'triangle', 'cymbals', 'tick', 'accent', 'kick', 'hat'];
const ALIASES = { mani: 'clap', petto: 'chest', cosce: 'thighs', piedi: 'feet', dita: 'snap',
  legnetti: 'claves', tamburello: 'tambourine', triangolo: 'triangle', piatti: 'cymbals' };
const ROOTS = {
  xylophone: [55, 60, 64, 67, 72, 77], glockenspiel: [55, 60, 64, 67, 72, 77],
  flute: [55, 60, 64, 67, 72, 77], piano: [48, 55, 60, 67, 72], bass: [43, 48, 55],
};
const sampleNames = [...DRUMS, ...Object.entries(ROOTS).flatMap(([name, roots]) => roots.map(root => `${name}-${root}`))];

export class AudioEngine {
  ctx = null;
  bpm = 90;
  melodicInstrument = 'xylophone';
  buffers = new Map();
  voices = new Set();
  run = 0;
  timer = null;
  frame = null;

  init() {
    if (this.ctx) return;
    const Context = window.AudioContext || window.webkitAudioContext;
    this.ctx = new Context();
    this.master = this.ctx.createGain();
    this.compressor = this.ctx.createDynamicsCompressor();
    this.#volume(settingsManager.getAll());
    settingsManager.subscribe(settings => this.#volume(settings));
    this.master.connect(this.compressor).connect(this.ctx.destination);
  }

  #volume(settings) {
    this.master.gain.setTargetAtTime(Number(settings.masterVolume ?? 0.85), this.ctx.currentTime, 0.015);
  }

  async prepare() {
    this.init();
    const resume = this.ctx.state === 'running' ? null : this.ctx.resume();
    this.loading ??= Promise.all(sampleNames.map(async name => {
      const response = await fetch(`${import.meta.env.BASE_URL}samples/${name}.mp3`);
      if (!response.ok) throw new Error(`Campione mancante: ${name}`);
      const buffer = await this.ctx.decodeAudioData(await response.arrayBuffer());
      this.buffers.set(name, buffer);
    })).catch(error => {
      this.loading = null;
      throw error;
    });
    await Promise.all([resume, this.loading]);
  }

  setBpm(bpm) { this.bpm = Math.max(40, Math.min(240, bpm)); }
  setMelodicInstrument(instrument) { this.melodicInstrument = instrument; }

  // Map event/render timestamps to the audio being heard, not the buffer
  // currently being rendered. Both count-in and judgement use this mapping.
  audibleTime(now = performance.now()) {
    if (!this.ctx) return 0;
    const stamp = this.ctx.getOutputTimestamp?.();
    if (stamp?.performanceTime > 0 && this.ctx.state === 'running') {
      return stamp.contextTime + (now - stamp.performanceTime) / 1000;
    }
    return this.ctx.currentTime;
  }

  #sample(name, time, { rate = 1, volume = 0.6, duration = Infinity } = {}) {
    const buffer = this.buffers.get(name);
    if (!buffer) {
      if (time == null) {
        const run = this.run;
        this.prepare().then(() => {
          if (run === this.run) this.#sample(name, null, { rate, volume, duration });
        }).catch(console.error);
      }
      return;
    }
    if (time == null && this.ctx.state !== 'running') this.ctx.resume().catch(console.error);
    const t = Math.max(time ?? this.ctx.currentTime, this.ctx.currentTime);
    const source = this.ctx.createBufferSource();
    const gain = this.ctx.createGain();
    source.buffer = buffer;
    source.playbackRate.value = rate;
    const length = Math.min(buffer.duration / rate, duration + 0.065);
    const release = Math.min(0.065, length / 3);
    gain.gain.setValueAtTime(volume, t);
    gain.gain.setValueAtTime(volume, t + length - release);
    gain.gain.linearRampToValueAtTime(0, t + length);
    source.connect(gain).connect(this.master);
    this.voices.add(source);
    source.onended = () => {
      this.voices.delete(source);
      source.disconnect();
      gain.disconnect();
    };
    source.start(t);
    source.stop(t + length);
  }

  #midi(instrument, midi, duration, time, volume) {
    if (!Number.isFinite(midi) || midi < 12 || midi > 108) return;
    const roots = ROOTS[instrument];
    const root = roots.reduce((a, b) => Math.abs(a - midi) <= Math.abs(b - midi) ? a : b);
    this.#sample(`${instrument}-${root}`, time, { rate: 2 ** ((midi - root) / 12), duration, volume });
  }

  playSoundByName(name, time = null, volume = 0.58) {
    const key = String(name).toLowerCase();
    this.#sample(ALIASES[key] || (DRUMS.includes(key) ? key : 'clap'), time, { volume });
  }

  playNote(pitch, duration = 0.5, time = null, accidental = 0, volume = 0.66) {
    const instrument = ROOTS[this.melodicInstrument] ? this.melodicInstrument : 'xylophone';
    this.#midi(instrument, toMidi(pitch, accidental), duration, time ?? null, volume);
  }

  playReferencePitch(pitch = 'DO', duration = 2.5, time = null, accidental = 0) {
    this.#midi('flute', toMidi(pitch, accidental), duration, time, 0.56);
  }

  playMetronome(beat = 1, time = null) {
    const accent = beat === 1;
    const gain = Number(settingsManager.get('metronomeVolume') ?? 0.7);
    this.#sample(accent ? 'accent' : 'tick', time, { volume: gain * (accent ? 0.52 : 0.36) });
  }

  playSuccessFanfare() {
    const run = this.run;
    this.prepare().then(() => {
      if (run !== this.run) return;
      const t = this.ctx.currentTime;
      [60, 64, 67, 72].forEach((pitch, i) => this.#midi('glockenspiel', pitch, 0.35, t + i * 0.105, 0.45));
    }).catch(console.error);
  }

  playFeedbackSound(rating) {
    if (rating === 'missed') this.playSoundByName('chest', null, 0.25);
    else this.#midi('glockenspiel', rating === 'perfect' ? 72 : 67, 0.15, null, 0.17);
  }

  async startScorePlayback(score, onProgress, onEnd, onError = console.error) {
    this.stopPlayback();
    const run = this.run;
    try {
      await this.prepare();
    } catch (error) {
      if (run === this.run) { onError(error); onEnd?.(); }
      return null;
    }
    if (run !== this.run) return null;

    const total = Math.max(1, score.totalSteps || 16);
    const timeline = createTimeline(this.ctx.currentTime + 0.09, score.bpm || this.bpm,
      score.timeSignature, score.countIn);
    const { timeAt, pulseSteps, barSteps, stepSeconds, countSteps } = timeline;
    const notesAt = new Map();
    for (const track of score.tracks || []) {
      for (const note of track.notes || []) {
        if (note.isRest) continue;
        if (!notesAt.has(note.step)) notesAt.set(note.step, []);
        notesAt.get(note.step).push({ ...note, sound: note.sound || track.defaultSound });
      }
    }
    const harmony = score.backing === 'melody' ? backingHarmony(score.melody || [], barSteps, total) : [];
    const changes = new Map((score.chords || []).map(chord => [chord.step, chord.midi]));
    let activeChord = null;
    let next = -countSteps;

    const schedule = () => {
      if (run !== this.run) return;
      const now = this.ctx.currentTime;
      while ((score.loop || next < total) && timeAt(next) < now + 0.13) {
        const time = timeAt(next);
        const step = next < 0 ? next : next % total;
        next++;
        // Don't bunch up overdue sounds after a long renderer stall.
        if (time < now - 0.035) continue;
        const barStep = (step % barSteps + barSteps) % barSteps;
        if ((step < 0 || score.playMetronome) && barStep % pulseSteps === 0) {
          this.playMetronome(barStep / pulseSteps + 1, time);
        }
        if (step < 0) {
          if (step === -countSteps && score.reference) {
            this.playReferencePitch(score.reference.pitch, countSteps * stepSeconds * 0.52, time,
              score.reference.accidental || 0);
          }
          continue;
        }
        if (step === 0) activeChord = null;
        if (changes.has(step)) activeChord = changes.get(step);
        if (score.backing && changes.size && (changes.has(step) || barStep % pulseSteps === 0)) {
          const duration = pulseSteps * stepSeconds * 0.75;
          activeChord?.forEach(pitch => this.#midi('piano', pitch, duration, time, 0.13));
        } else if (score.backing === 'rhythm' && !changes.size) {
          const pulse = Math.floor(barStep / pulseSteps);
          if (barStep % pulseSteps === 0) this.playSoundByName(pulse % 2 ? 'thighs' : 'kick', time, 0.29);
          if (barStep % pulseSteps === pulseSteps / 2) this.playSoundByName('hat', time, 0.21);
        } else if (score.backing === 'melody' && !changes.size && barStep % pulseSteps === 0) {
          const chord = harmony[Math.floor(step / barSteps)];
          if (chord) {
            const duration = pulseSteps * stepSeconds * 0.82;
            if (barStep === 0) this.#midi('bass', chord[0], duration, time, 0.23);
            chord.slice(1).forEach((pitch, i) => this.#midi('piano', pitch, duration, time + i * 0.014, 0.19));
          }
        }
        for (const note of notesAt.get(step) || []) {
          const velocity = note.velocity == null ? null : Math.max(1, Math.min(127, note.velocity)) / 127;
          const duration = (note.duration || 4) * stepSeconds;
          if (note.pitch && note.instrument && ROOTS[note.instrument]) {
            this.#midi(note.instrument, toMidi(note.pitch, note.accidental || 0), duration, time, velocity ?? 0.66);
          } else if (note.pitch) {
            this.playNote(note.pitch, duration, time, note.accidental || 0, velocity ?? 0.66);
          } else if (note.sound) this.playSoundByName(note.sound, time, velocity ?? 0.58);
        }
      }
      if (score.loop || next < total) this.timer = setTimeout(schedule, 20);
    };

    const update = (now) => {
      if (run !== this.run) return;
      const time = this.audibleTime(now);
      const position = timeline.positionAt(time);
      const step = Math.max(0, score.loop ? position % total : Math.min(total, position));
      onProgress?.({
        step: Math.floor(step), position: step, totalSteps: total,
        measureBeat: Math.floor((step % barSteps) / pulseSteps) + 1,
        beatProgress: (step % pulseSteps) / pulseSteps,
        fractionOfMeasure: (step % barSteps) / barSteps,
        count: timeline.countAt(time), elapsedMs: position * stepSeconds * 1000,
      });
      if (run !== this.run) return;
      if (!score.loop && time >= timeAt(total) + (score.endPadding ?? 0.15)) {
        this.stopPlayback();
        onEnd?.();
        return;
      }
      this.frame = requestAnimationFrame(update);
    };
    schedule();
    this.frame = requestAnimationFrame(update);
    return timeline;
  }

  stopPlayback() {
    this.run++;
    clearTimeout(this.timer);
    if (this.frame != null) cancelAnimationFrame(this.frame);
    this.frame = null;
    this.voices.forEach(source => source.stop());
    this.voices.clear();
  }
}

export const audioEngine = new AudioEngine();
