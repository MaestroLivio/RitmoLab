/**
 * AudioEngine.js - Pure Web Audio API Synthesizer & Scheduler
 * No external audio files used. 100% procedural synthesis.
 */

// Solfege base frequencies (C4 octave)
export const NOTE_FREQUENCIES = {
  'C3': 130.81, 'D3': 146.83, 'E3': 164.81, 'F3': 174.61, 'G3': 196.00, 'A3': 220.00, 'B3': 246.94,
  'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23, 'G4': 392.00, 'A4': 440.00, 'B4': 493.88,
  'C5': 523.25, 'D5': 587.33, 'E5': 659.25, 'F5': 698.46, 'G5': 783.99, 'A5': 880.00, 'B5': 987.77,
};

// Staff Pitch mapping for Solfege / Notation lines and spaces
// Pentagram lines (bottom to top): E4 (line 1), G4 (line 2), B4 (line 3), D5 (line 4), F5 (line 5)
// Pentagram spaces: F4 (space 1), A4 (space 2), C5 (space 3), E5 (space 4)
// Bigram (2 lines): Line 1 = Sol4, Line 2 = Mi4 (or space = La4)
export const SOLFEGE_MAP = {
  'DO': { note: 'C4', label: 'Do', color: '#EF4444', handSign: '✊', syllable: 'Do' },
  'RE': { note: 'D4', label: 'Re', color: '#F97316', handSign: '✋', syllable: 'Re' },
  'MI': { note: 'E4', label: 'Mi', color: '#FBBF24', handSign: '🫱', syllable: 'Mi' },
  'FA': { note: 'F4', label: 'Fa', color: '#10B981', handSign: '👎', syllable: 'Fa' },
  'SOL': { note: 'G4', label: 'Sol', color: '#3B82F6', handSign: '👋', syllable: 'Sol' },
  'LA': { note: 'A4', label: 'La', color: '#6366F1', handSign: '🤏', syllable: 'La' },
  'SI': { note: 'B4', label: 'Si', color: '#EC4899', handSign: '☝️', syllable: 'Si' },
  'DO_HIGH': { note: 'C5', label: 'Do²', color: '#EF4444', handSign: '✊', syllable: 'Do' }
};

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.isPlaying = false;
    this.bpm = 90;
    this.currentStep = 0; // 0 to 15 (16th notes in a 4/4 measure) or global step
    this.totalSteps = 16;
    this.timerId = null;
    this.scheduleAheadTime = 0.1; // seconds
    this.lookahead = 25.0; // milliseconds
    this.nextNoteTime = 0.0;
    this.playbackPosition = 0; // in beats or sixteenths for UI
    this.onProgressUpdate = null; // callback for playhead & pie chart
    this.onPlaybackEnd = null;
    this.melodicInstrument = 'xylophone'; // 'xylophone' | 'flute' | 'glockenspiel'
    this.initAudioContext();
  }

  initAudioContext() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass && !this.ctx) {
      this.ctx = new AudioContextClass();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.85, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
  }

  ensureContext() {
    if (!this.ctx) {
      this.initAudioContext();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setBpm(bpm) {
    this.bpm = Math.max(40, Math.min(240, bpm));
  }

  setVolume(val) {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(Math.max(0, Math.min(1, val)), this.ctx.currentTime, 0.02);
    }
  }

  setMelodicInstrument(inst) {
    this.melodicInstrument = inst;
  }

  // -------------------------------------------------------------
  // SYNTHESIS: BODY PERCUSSION
  // -------------------------------------------------------------

  /**
   * Mani (Clap) - Short bandpass noise burst + snap
   */
  playClap(time = 0) {
    this.ensureContext();
    const ctx = this.ctx;
    const t = time || ctx.currentTime;

    // Noise buffer
    const bufferSize = ctx.sampleRate * 0.05; // 50ms
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1150, t);
    filter.Q.setValueAtTime(2.2, t);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.9, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

    // Initial click
    const clickOsc = ctx.createOscillator();
    clickOsc.type = 'triangle';
    clickOsc.frequency.setValueAtTime(600, t);
    clickOsc.frequency.exponentialRampToValueAtTime(120, t + 0.015);
    const clickGain = ctx.createGain();
    clickGain.gain.setValueAtTime(0.5, t);
    clickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.015);

    clickOsc.connect(clickGain);
    clickGain.connect(this.masterGain);
    clickOsc.start(t);
    clickOsc.stop(t + 0.02);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    whiteNoise.start(t);
    whiteNoise.stop(t + 0.07);
  }

  /**
   * Petto (Chest) - Warm descending low sine sweep
   */
  playChest(time = 0) {
    this.ensureContext();
    const ctx = this.ctx;
    const t = time || ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(50, t + 0.12);

    gain.gain.setValueAtTime(1.0, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.15);
  }

  /**
   * Cosce (Thighs) - Medium punchy sine sweep with slap transient
   */
  playThighs(time = 0) {
    this.ensureContext();
    const ctx = this.ctx;
    const t = time || ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(280, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.08);

    gain.gain.setValueAtTime(0.85, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

    // Slap transient
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, t);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.1);
  }

  /**
   * Piedi (Feet / Stomp) - Low kick drum thump
   */
  playFeet(time = 0) {
    this.ensureContext();
    const ctx = this.ctx;
    const t = time || ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(100, t);
    osc.frequency.exponentialRampToValueAtTime(35, t + 0.18);

    gain.gain.setValueAtTime(1.1, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.22);
  }

  /**
   * Dita (Snap / Finger click) - High snappy chirp and noise
   */
  playSnap(time = 0) {
    this.ensureContext();
    const ctx = this.ctx;
    const t = time || ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(3200, t);
    osc.frequency.exponentialRampToValueAtTime(900, t + 0.02);

    gain.gain.setValueAtTime(0.7, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.025);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.03);
  }

  // -------------------------------------------------------------
  // SYNTHESIS: ORFF INSTRUMENTARIUM
  // -------------------------------------------------------------

  /**
   * Legnetti (Claves) - Resonant wood strike dual sine
   */
  playClaves(time = 0) {
    this.ensureContext();
    const ctx = this.ctx;
    const t = time || ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(2200, t);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(2780, t);

    gain.gain.setValueAtTime(0.9, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.masterGain);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + 0.06);
    osc2.stop(t + 0.06);
  }

  /**
   * Tamburello (Tambourine) - Frame drum slap + metallic jingles rattle
   */
  playTambourine(time = 0) {
    this.ensureContext();
    const ctx = this.ctx;
    const t = time || ctx.currentTime;

    // Skin drum thump
    const osc = ctx.createOscillator();
    const skinGain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(70, t + 0.1);
    skinGain.gain.setValueAtTime(0.6, t);
    skinGain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    osc.connect(skinGain);
    skinGain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.13);

    // Jingles (white noise highpassed with fast amplitude tremolo)
    const bufferSize = ctx.sampleRate * 0.18;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 + 0.5 * Math.sin(i * 0.04));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(4500, t);

    const jingleGain = ctx.createGain();
    jingleGain.gain.setValueAtTime(0.7, t);
    jingleGain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    noise.connect(filter);
    filter.connect(jingleGain);
    jingleGain.connect(this.masterGain);

    noise.start(t);
    noise.stop(t + 0.2);
  }

  /**
   * Triangolo (Triangle) - Detuned high harmonic sine oscillators with long metallic decay
   */
  playTriangle(time = 0) {
    this.ensureContext();
    const ctx = this.ctx;
    const t = time || ctx.currentTime;

    const freqs = [2850, 3920, 5600, 8150];
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);

    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq + (idx * 3), t);
      osc.connect(gain);
      osc.start(t);
      osc.stop(t + 1.3);
    });

    gain.connect(this.masterGain);
  }

  /**
   * Piatti (Cymbals / Crash) - Shimmering multi-band noise with long decay
   */
  playCymbals(time = 0) {
    this.ensureContext();
    const ctx = this.ctx;
    const t = time || ctx.currentTime;

    const bufferSize = ctx.sampleRate * 1.5;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(3200, t);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.65, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(t);
    noise.stop(t + 1.5);
  }

  /**
   * General dispatch for rhythmic/instrument sound by name
   */
  playSoundByName(name, time = 0) {
    switch (name?.toLowerCase()) {
      case 'clap':
      case 'mani':
        this.playClap(time);
        break;
      case 'petto':
      case 'chest':
        this.playChest(time);
        break;
      case 'cosce':
      case 'thighs':
        this.playThighs(time);
        break;
      case 'piedi':
      case 'feet':
        this.playFeet(time);
        break;
      case 'dita':
      case 'snap':
        this.playSnap(time);
        break;
      case 'claves':
      case 'legnetti':
        this.playClaves(time);
        break;
      case 'tamburello':
      case 'tambourine':
        this.playTambourine(time);
        break;
      case 'triangolo':
      case 'triangle':
        this.playTriangle(time);
        break;
      case 'piatti':
      case 'cymbals':
        this.playCymbals(time);
        break;
      default:
        this.playClap(time);
        break;
    }
  }

  // -------------------------------------------------------------
  // SYNTHESIS: MELODIC / SOLFEGE PITCHES (Dynamic duration support)
  // -------------------------------------------------------------

  /**
   * Plays a pitch (frequency or note name) with dynamic duration (durationSec)
   * Supports 'xylophone' (Orff metallophone/xylophone), 'flute', 'glockenspiel'
   */
  playNote(frequencyOrName, durationSec = 0.5, time = 0, accidental = 0) {
    this.ensureContext();
    const ctx = this.ctx;
    const t = time || ctx.currentTime;

    let baseFreq = 440;
    if (typeof frequencyOrName === 'number') {
      baseFreq = frequencyOrName;
    } else if (NOTE_FREQUENCIES[frequencyOrName]) {
      baseFreq = NOTE_FREQUENCIES[frequencyOrName];
    } else if (SOLFEGE_MAP[frequencyOrName.toUpperCase()]) {
      const noteName = SOLFEGE_MAP[frequencyOrName.toUpperCase()].note;
      baseFreq = NOTE_FREQUENCIES[noteName] || 440;
    }

    // Apply accidental: +1 semitone (#), -1 semitone (b)
    const freq = baseFreq * Math.pow(2, accidental / 12);

    if (this.melodicInstrument === 'flute') {
      this._playFlute(freq, durationSec, t);
    } else if (this.melodicInstrument === 'glockenspiel') {
      this._playGlockenspiel(freq, durationSec, t);
    } else {
      // Default: Orff Xylophone / Metallophone
      this._playXylophone(freq, durationSec, t);
    }
  }

  _playXylophone(freq, durationSec, t) {
    const ctx = this.ctx;
    const fundamental = ctx.createOscillator();
    const overtone = ctx.createOscillator();
    const gain = ctx.createGain();

    fundamental.type = 'triangle';
    fundamental.frequency.setValueAtTime(freq, t);

    // Woody inharmonic partial ~3x or 2.76x
    overtone.type = 'sine';
    overtone.frequency.setValueAtTime(freq * 3.01, t);

    const overtoneGain = ctx.createGain();
    overtoneGain.gain.setValueAtTime(0.3, t);
    overtoneGain.gain.exponentialRampToValueAtTime(0.001, t + Math.min(durationSec * 0.4, 0.2));

    // ADSR for xylophone bar: instant attack, natural woody decay proportional to note duration
    const decayTime = Math.min(durationSec * 1.2, 1.8);
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.75, t + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + decayTime);

    fundamental.connect(gain);
    overtone.connect(overtoneGain);
    overtoneGain.connect(gain);
    gain.connect(this.masterGain);

    fundamental.start(t);
    overtone.start(t);
    fundamental.stop(t + decayTime + 0.05);
    overtone.stop(t + decayTime + 0.05);
  }

  _playFlute(freq, durationSec, t) {
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    const vibrato = ctx.createOscillator();
    const vibratoGain = ctx.createGain();
    const gain = ctx.createGain();

    // Soft flute tone with sine and gentle vibrato
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);

    vibrato.frequency.setValueAtTime(5.5, t); // 5.5 Hz vibrato
    vibratoGain.gain.setValueAtTime(3.0, t); // +/- 3 Hz
    vibrato.connect(osc.frequency);

    // Soft ADSR envelope
    const attack = 0.04;
    const release = 0.06;
    const sustain = durationSec > attack + release ? durationSec - attack - release : 0.1;

    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(0.65, t + attack);
    gain.gain.setValueAtTime(0.65, t + attack + sustain);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + attack + sustain + release);

    osc.connect(gain);
    gain.connect(this.masterGain);

    vibrato.start(t);
    osc.start(t);
    vibrato.stop(t + durationSec + 0.1);
    osc.stop(t + durationSec + 0.1);
  }

  _playGlockenspiel(freq, durationSec, t) {
    const ctx = this.ctx;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, t);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 2.756, t); // metallic bell mode

    const ringDuration = Math.max(durationSec * 1.5, 0.8);

    gain.gain.setValueAtTime(0.6, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + ringDuration);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.masterGain);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + ringDuration + 0.05);
    osc2.stop(t + ringDuration + 0.05);
  }

  // -------------------------------------------------------------
  // METRONOME PROCEDURAL CLICKS
  // -------------------------------------------------------------

  playMetronome(beat = 1, time = 0) {
    this.ensureContext();
    const ctx = this.ctx;
    const t = time || ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    const isAccent = beat === 1;
    osc.type = isAccent ? 'sine' : 'triangle';
    osc.frequency.setValueAtTime(isAccent ? 1200 : 800, t);
    osc.frequency.exponentialRampToValueAtTime(200, t + 0.025);

    gain.gain.setValueAtTime(isAccent ? 0.7 : 0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.035);
  }

  // -------------------------------------------------------------
  // PRECISION SCHEDULER & PLAYBACK LOOP
  // -------------------------------------------------------------

  /**
   * Schedule playback of a score
   * @param {Object} score - { tracks: [ { notes: [ { step, duration, type, sound, pitch, accidental } ] } ], totalSteps: 16, bpm: 90, playMetronome: true }
   */
  startScorePlayback(score, onProgress, onEnd) {
    this.ensureContext();
    this.stopPlayback();

    this.isPlaying = true;
    this.onProgressUpdate = onProgress;
    this.onPlaybackEnd = onEnd;
    this.bpm = score.bpm || this.bpm;
    this.totalSteps = score.totalSteps || 16;
    this.currentStep = 0;

    const secondsPerBeat = 60.0 / this.bpm;
    const secondsPer16th = secondsPerBeat / 4.0;
    this.nextNoteTime = this.ctx.currentTime + 0.05;

    const timeSignature = score.timeSignature || '4/4';
    let sixteenthsPerBar = 16;
    let beatsPerBar = 4;
    let beatStep = 4;

    if (timeSignature === '2/4') {
      sixteenthsPerBar = 8;
      beatsPerBar = 2;
      beatStep = 4;
    } else if (timeSignature === '3/4') {
      sixteenthsPerBar = 12;
      beatsPerBar = 3;
      beatStep = 4;
    } else if (timeSignature === '6/8') {
      sixteenthsPerBar = 12;
      beatsPerBar = 6;
      beatStep = 2;
    }

    const scheduler = () => {
      while (this.nextNoteTime < this.ctx.currentTime + this.scheduleAheadTime && this.isPlaying) {
        this._scheduleStep(this.currentStep, this.nextNoteTime, score, secondsPer16th, sixteenthsPerBar, beatsPerBar, beatStep);
        
        // Notify UI for playhead & pie chart
        const stepToReport = this.currentStep;
        const timeOffset = (this.nextNoteTime - this.ctx.currentTime) * 1000;
        setTimeout(() => {
          if (this.isPlaying && this.onProgressUpdate) {
            this.onProgressUpdate({
              step: stepToReport,
              totalSteps: this.totalSteps,
              measureBeat: (Math.floor((stepToReport % sixteenthsPerBar) / beatStep)) + 1,
              beatProgress: (stepToReport % beatStep) / beatStep,
              fractionOfMeasure: (stepToReport % sixteenthsPerBar) / sixteenthsPerBar,
            });
          }
        }, Math.max(0, timeOffset));

        this.nextNoteTime += secondsPer16th;
        this.currentStep++;

        if (this.currentStep >= this.totalSteps) {
          if (score.loop) {
            // Continuous Loop: reset currentStep to 0 and keep playing seamlessly in time
            this.currentStep = 0;
          } else {
            // Playback finished
            const endTimeOffset = (this.nextNoteTime - this.ctx.currentTime + 0.3) * 1000;
            setTimeout(() => {
              if (this.isPlaying) {
                this.stopPlayback();
                if (this.onPlaybackEnd) this.onPlaybackEnd();
              }
            }, Math.max(0, endTimeOffset));
            return;
          }
        }
      }

      if (this.isPlaying) {
        this.timerId = setTimeout(scheduler, this.lookahead);
      }
    };

    scheduler();
  }

  /**
   * Pitch-pipe / Vocal Intonation Reference Pitch (Prendi l'intonazione)
   * Warm acoustic pitch with gentle vibrato and overtones for choir tuning
   */
  playReferencePitch(pitchOrFreq = 'DO', durationSec = 2.5, time = 0) {
    this.ensureContext();
    const ctx = this.ctx;
    const t = time || ctx.currentTime;

    let baseFreq = 261.63; // Default C4 (Do)
    if (typeof pitchOrFreq === 'number') {
      baseFreq = pitchOrFreq;
    } else if (NOTE_FREQUENCIES[pitchOrFreq]) {
      baseFreq = NOTE_FREQUENCIES[pitchOrFreq];
    } else if (SOLFEGE_MAP[pitchOrFreq.toUpperCase()]) {
      const noteName = SOLFEGE_MAP[pitchOrFreq.toUpperCase()].note;
      baseFreq = NOTE_FREQUENCIES[noteName] || 261.63;
    }

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(baseFreq, t);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(baseFreq * 2, t);

    // Warm vibrato at 4.5 Hz
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(4.5, t);
    lfoGain.gain.setValueAtTime(2.0, t);
    lfo.connect(lfoGain);
    lfoGain.connect(osc1.frequency);
    lfoGain.connect(osc2.frequency);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(baseFreq * 4, t);

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.7, t + 0.25);
    gain.gain.setValueAtTime(0.7, t + Math.max(0.5, durationSec - 0.4));
    gain.gain.exponentialRampToValueAtTime(0.0001, t + durationSec);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    lfo.start(t);
    osc1.start(t);
    osc2.start(t);

    lfo.stop(t + durationSec + 0.1);
    osc1.stop(t + durationSec + 0.1);
    osc2.stop(t + durationSec + 0.1);
  }

  /**
   * Harmonic Accompaniment Chords (Armonia di Accompagnamento per Coro)
   * Warm, supportive procedural acoustic chords (I - IV - V - I / Bordone)
   */
  playAccompanimentChord(chordType = 'I', durationSec = 1.6, time = 0) {
    this.ensureContext();
    const ctx = this.ctx;
    const t = time || ctx.currentTime;

    let chordFreqs = [130.81, 196.00, 261.63, 329.63]; // C3, G3, C4, E4 (I: Do maggiore)
    if (chordType === 'IV') {
      chordFreqs = [174.61, 261.63, 349.23, 440.00]; // F3, C4, F4, A4 (IV: Fa maggiore)
    } else if (chordType === 'V') {
      chordFreqs = [196.00, 293.66, 392.00, 493.88]; // G3, D4, G4, B4 (V: Sol maggiore)
    } else if (chordType === 'bordone' || chordType === 'drone') {
      chordFreqs = [130.81, 196.00, 261.63]; // C3, G3, C4 (Bordone fondamentale)
    }

    const chordGain = ctx.createGain();
    chordGain.gain.setValueAtTime(0.001, t);
    chordGain.gain.linearRampToValueAtTime(0.3, t + 0.08);
    chordGain.gain.exponentialRampToValueAtTime(0.0001, t + durationSec);

    chordFreqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = idx === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      oscGain.gain.setValueAtTime(idx === 0 ? 0.5 : 0.3, t);

      osc.connect(oscGain);
      oscGain.connect(chordGain);

      osc.start(t + idx * 0.02);
      osc.stop(t + durationSec + 0.1);
    });

    chordGain.connect(this.masterGain);
  }

  _scheduleStep(step, time, score, secondsPer16th, sixteenthsPerBar = 16, beatsPerBar = 4, beatStep = 4) {
    // Play metronome if enabled (accented on beat 1)
    if (score.playMetronome && step % beatStep === 0) {
      const beatInMeasure = (Math.floor((step % sixteenthsPerBar) / beatStep)) + 1;
      this.playMetronome(beatInMeasure, time);
    }

    // Play harmonic accompaniment chords in singing mode
    if (score.harmonicAccompaniment && step % (beatStep * 2) === 0) {
      const beatInMeasure = (Math.floor((step % sixteenthsPerBar) / beatStep)) + 1;
      const chordType = beatInMeasure === 1 ? 'I' : beatInMeasure === 3 ? 'V' : 'bordone';
      this.playAccompanimentChord(chordType, secondsPer16th * beatStep * 2 * 0.95, time);
    }

    if (!score.tracks) return;

    // Check all tracks for notes starting at this step
    score.tracks.forEach(track => {
      if (!track.notes) return;
      track.notes.forEach(note => {
        if (note.step === step) {
          const durationSec = (note.duration || 4) * secondsPer16th;
          if (note.isRest) {
            // It's a pause/rest, silence
            return;
          }
          if (note.pitch) {
            // Melodic note
            this.playNote(note.pitch, durationSec, time, note.accidental || 0);
          } else if (note.sound || track.defaultSound) {
            // Rhythmic body percussion / Orff instrument
            this.playSoundByName(note.sound || track.defaultSound, time);
          }
        }
      });
    });
  }

  stopPlayback() {
    this.isPlaying = false;
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  /**
   * Play a brief cheerful success chime when completing a level
   */
  playSuccessFanfare() {
    this.ensureContext();
    const ctx = this.ctx;
    const t = ctx.currentTime;
    const chords = [
      { note: 'C4', delay: 0.0 },
      { note: 'E4', delay: 0.1 },
      { note: 'G4', delay: 0.2 },
      { note: 'C5', delay: 0.3 },
      { note: 'G4', delay: 0.45 },
      { note: 'C5', delay: 0.55 },
    ];
    chords.forEach(({ note, delay }) => {
      this._playGlockenspiel(NOTE_FREQUENCIES[note], 0.6, t + delay);
    });
  }

  /**
   * Play feedback sound for rhythm evaluation
   */
  playFeedbackSound(rating) {
    this.ensureContext();
    const ctx = this.ctx;
    const t = ctx.currentTime;
    if (rating === 'perfect') {
      this._playGlockenspiel(NOTE_FREQUENCIES['C5'], 0.2, t);
    } else if (rating === 'good') {
      this._playGlockenspiel(NOTE_FREQUENCIES['G4'], 0.2, t);
    } else {
      // Missed / dull thud
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(120, t);
      osc.frequency.linearRampToValueAtTime(70, t + 0.1);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.13);
    }
  }
}

export const audioEngine = new AudioEngine();
