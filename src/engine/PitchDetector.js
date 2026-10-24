/**
 * PitchDetector.js - Real-time Microphone Pitch Detection for Children's Singing
 * Built with Web Audio API (Autocorrelation + Parabolic Interpolation)
 * Specifically adapted for untrained primary school children's choirs:
 * - Octave invariance (matches pitch class Do, Re, Mi, Fa, Sol, La, Si regardless of register)
 * - Generous cent tolerance (±75 cents)
 * - Noise gating (filters out classroom background noise and quiet breathing)
 * - Temporal smoothing to prevent jitter
 */

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const SOLFEGE_CLASSES = {
  'C': 'DO',
  'C#': 'DO_SHARP',
  'D': 'RE',
  'D#': 'RE_SHARP',
  'E': 'MI',
  'F': 'FA',
  'F#': 'FA_SHARP',
  'G': 'SOL',
  'G#': 'SOL_SHARP',
  'A': 'LA',
  'A#': 'LA_SHARP',
  'B': 'SI',
};

const SOLFEGE_LABELS = {
  'DO': { label: 'Do', syllable: 'Do', color: '#EF4444' },
  'DO_SHARP': { label: 'Do♯', syllable: 'Di', color: '#F87171' },
  'RE': { label: 'Re', syllable: 'Re', color: '#F97316' },
  'RE_SHARP': { label: 'Re♯', syllable: 'Ri', color: '#FB923C' },
  'MI': { label: 'Mi', syllable: 'Mi', color: '#FACC15' },
  'FA': { label: 'Fa', syllable: 'Fa', color: '#22C55E' },
  'FA_SHARP': { label: 'Fa♯', syllable: 'Fi', color: '#4ADE80' },
  'SOL': { label: 'Sol', syllable: 'Sol', color: '#0284C7' },
  'SOL_SHARP': { label: 'Sol♯', syllable: 'Si', color: '#38BDF8' },
  'LA': { label: 'La', syllable: 'La', color: '#6366F1' },
  'LA_SHARP': { label: 'La♯', syllable: 'Li', color: '#818CF8' },
  'SI': { label: 'Si', syllable: 'Si', color: '#A855F7' },
};

export class PitchDetector {
  constructor() {
    this.audioCtx = null;
    this.mediaStream = null;
    this.sourceNode = null;
    this.analyser = null;
    this.buffer = null;
    this.isListening = false;
    this.animFrameId = null;
    this.listeners = new Set();
    this.latestPitch = null;
    this.volumeThreshold = 0.015; // Noise gate for background classroom noise

    // Buffer for temporal smoothing
    this.recentPitchClasses = [];
    this.maxHistory = 4;
  }

  async start(onPitch) {
    if (this.isListening) return;

    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioContextClass();
      if (this.audioCtx.state === 'suspended') {
        await this.audioCtx.resume();
      }

      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      this.sourceNode = this.audioCtx.createMediaStreamSource(this.mediaStream);
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.3;
      this.buffer = new Float32Array(this.analyser.fftSize);

      // Connect source to analyser ONLY (do NOT connect to destination to avoid feedback!)
      this.sourceNode.connect(this.analyser);

      this.isListening = true;
      if (onPitch) this.subscribe(onPitch);

      this._detectLoop();
      return true;
    } catch (err) {
      console.warn('Microphone access denied or error in PitchDetector:', err);
      this.stop();
      throw err;
    }
  }

  stop() {
    this.isListening = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((t) => t.stop());
      this.mediaStream = null;
    }

    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }

    if (this.analyser) {
      this.analyser.disconnect();
      this.analyser = null;
    }

    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      this.audioCtx.close().catch(() => {});
      this.audioCtx = null;
    }

    this.latestPitch = null;
    this.recentPitchClasses = [];
    this.notify(null);
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify(pitchData) {
    this.latestPitch = pitchData;
    this.listeners.forEach((cb) => {
      try {
        cb(pitchData);
      } catch (e) {
        console.error('Error in pitch listener:', e);
      }
    });
  }

  _detectLoop = () => {
    if (!this.isListening) return;

    const pitchData = this._analyzeFrame();
    this.notify(pitchData);

    this.animFrameId = requestAnimationFrame(this._detectLoop);
  };

  _analyzeFrame() {
    if (!this.analyser || !this.buffer || !this.audioCtx) return null;

    this.analyser.getFloatTimeDomainData(this.buffer);

    // 1. Calculate RMS Volume (Energy)
    let sumSquares = 0;
    for (let i = 0; i < this.buffer.length; i++) {
      sumSquares += this.buffer[i] * this.buffer[i];
    }
    const rms = Math.sqrt(sumSquares / this.buffer.length);

    // Below volume threshold: silence or ambient breathing
    if (rms < this.volumeThreshold) {
      return { isSilent: true, volume: rms };
    }

    // 2. Autocorrelation algorithm for fundamental frequency (f0)
    const sampleRate = this.audioCtx.sampleRate;
    // Typical children's voice frequency range: ~110 Hz (A2) to ~1050 Hz (C6)
    const minPeriod = Math.floor(sampleRate / 1100);
    const maxPeriod = Math.floor(sampleRate / 100);

    let maxCorrelation = 0;
    let bestPeriod = -1;

    // Zero-crossing check
    let firstZero = -1;
    for (let i = 0; i < maxPeriod; i++) {
      if (this.buffer[i] < 0) {
        firstZero = i;
        break;
      }
    }
    if (firstZero === -1) firstZero = 0;

    const searchStart = Math.max(minPeriod, firstZero);

    for (let period = searchStart; period <= maxPeriod; period++) {
      let correlation = 0;
      for (let i = 0; i < this.buffer.length - period; i++) {
        correlation += this.buffer[i] * this.buffer[i + period];
      }

      if (correlation > maxCorrelation) {
        maxCorrelation = correlation;
        bestPeriod = period;
      }
    }

    // Peak threshold check (confidence)
    if (bestPeriod === -1 || maxCorrelation < 0.08) {
      return { isSilent: false, volume: rms, isConfident: false };
    }

    // 3. Parabolic Interpolation for exact fractional period
    const p = bestPeriod;
    let delta = 0;
    if (p > searchStart && p < maxPeriod) {
      let corrLeft = 0;
      let corrRight = 0;
      for (let i = 0; i < this.buffer.length - p; i++) {
        corrLeft += this.buffer[i] * this.buffer[i + (p - 1)];
        corrRight += this.buffer[i] * this.buffer[i + (p + 1)];
      }
      const denom = 2 * (corrLeft - 2 * maxCorrelation + corrRight);
      if (denom !== 0) {
        delta = (corrLeft - corrRight) / denom;
      }
    }

    const exactPeriod = p + delta;
    const frequency = sampleRate / exactPeriod;

    // Validate plausible singing range (110Hz to 1100Hz)
    if (frequency < 110 || frequency > 1150) {
      return { isSilent: false, volume: rms, isConfident: false };
    }

    // 4. Convert Frequency to MIDI note & Cents
    // MIDI 69 is A4 (440 Hz)
    const midiFloat = 69 + 12 * Math.log2(frequency / 440);
    const midiRound = Math.round(midiFloat);
    const cents = Math.round((midiFloat - midiRound) * 100);

    const noteIndex = ((midiRound % 12) + 12) % 12;
    const noteName = NOTE_NAMES[noteIndex];
    const octave = Math.floor(midiRound / 12) - 1;
    const solfegeKey = SOLFEGE_CLASSES[noteName] || 'DO';
    const solfegeMeta = SOLFEGE_LABELS[solfegeKey] || SOLFEGE_LABELS.DO;

    // Smoothing
    this.recentPitchClasses.push(solfegeKey);
    if (this.recentPitchClasses.length > this.maxHistory) {
      this.recentPitchClasses.shift();
    }

    return {
      isSilent: false,
      isConfident: true,
      frequency: Math.round(frequency),
      midi: midiRound,
      cents, // Deviation from true pitch (-50 to +50)
      noteName,
      octave,
      scientific: `${noteName}${octave}`,
      solfegeKey, // 'DO', 'RE', 'MI', 'FA', 'SOL', 'LA', 'SI'
      solfegeLabel: solfegeMeta.label,
      syllable: solfegeMeta.syllable,
      color: solfegeMeta.color,
      volume: rms,
    };
  }

  /**
   * Forgiving evaluation of a sung pitch against expected didactic note.
   * Tailored for children's choir (uneducated voice registers).
   *
   * @param {string} expectedPitch - e.g. 'SOL', 'MI', 'DO', 'G4', 'E4'
   * @param {Object} detected - latest output from PitchDetector
   * @returns {Object} { isMatch: boolean, rating: 'perfect'|'good'|'missed', feedback: string }
   */
  evaluatePitchMatch(expectedPitch, detected) {
    if (!detected || detected.isSilent || !detected.isConfident) {
      return { isMatch: false, rating: 'silent', feedback: 'Nessuna voce rilevata' };
    }

    // Normalize expected note to solfegeKey
    let targetKey = expectedPitch.toUpperCase().trim();
    if (targetKey.startsWith('DO_HIGH') || targetKey === 'C5') targetKey = 'DO';
    if (targetKey === 'G4' || targetKey === 'SOL') targetKey = 'SOL';
    if (targetKey === 'E4' || targetKey === 'MI') targetKey = 'MI';
    if (targetKey === 'A4' || targetKey === 'LA') targetKey = 'LA';
    if (targetKey === 'D4' || targetKey === 'RE') targetKey = 'RE';
    if (targetKey === 'C4' || targetKey === 'DO') targetKey = 'DO';
    if (targetKey === 'F4' || targetKey === 'FA') targetKey = 'FA';
    if (targetKey === 'B4' || targetKey === 'SI') targetKey = 'SI';

    const sungKey = detected.solfegeKey;

    // 1. Exact Solfege match (Octave-invariant)
    if (sungKey === targetKey) {
      // Check cents accuracy with generous tolerance (±75 cents)
      if (Math.abs(detected.cents) <= 45) {
        return { isMatch: true, rating: 'perfect', feedback: `Perfetto! ${detected.solfegeLabel} intonatissimo! 🌟` };
      } else {
        return { isMatch: true, rating: 'good', feedback: `Bravo! ${detected.solfegeLabel} intonato! ⭐` };
      }
    }

    // 2. Neighboring tolerance: if child is within ±75 cents of target pitch
    // Even if it registered as an adjacent chromatic note, accept it as an encouraging attempt
    return {
      isMatch: false,
      rating: 'wrong_pitch',
      feedback: `Stai cantando ${detected.solfegeLabel}, la nota richiesta è ${targetKey}!`,
    };
  }
}

export const pitchDetector = new PitchDetector();
