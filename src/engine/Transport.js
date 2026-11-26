export function getMeter(signature = '4/4') {
  const [top, bottom] = signature.split('/').map(Number);
  if (![[2, 4], [3, 4], [4, 4], [6, 8]].some(([a, b]) => a === top && b === bottom)) {
    return getMeter('4/4');
  }
  const barSteps = top * 16 / bottom;
  const pulseSteps = bottom === 8 ? 6 : 4;
  return { barSteps, pulseSteps, pulses: barSteps / pulseSteps };
}

export function createTimeline(start, bpm, signature, countIn = false) {
  const meter = getMeter(signature);
  const stepSeconds = 60 / bpm / 4;
  const countSteps = countIn ? meter.barSteps : 0;
  const musicStart = start + countSteps * stepSeconds;
  return {
    ...meter,
    start, musicStart, stepSeconds, countSteps,
    timeAt: (step) => musicStart + step * stepSeconds,
    positionAt: (time) => (time - musicStart) / stepSeconds,
    countAt: (time) => time < start || time >= musicStart
      ? 0 : meter.pulses - Math.floor((time - start) / (stepSeconds * meter.pulseSteps) + 1e-8),
  };
}

const PITCH_CLASS = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const SOLFEGE = {
  DO: 'C4', RE: 'D4', MI: 'E4', FA: 'F4', SOL: 'G4', LA: 'A4', SI: 'B4',
  DO_HIGH: 'C5', RE_HIGH: 'D5', MI_HIGH: 'E5', FA_HIGH: 'F5',
};

export function toMidi(pitch, accidental = 0) {
  if (pitch && typeof pitch === 'object' && Number.isFinite(pitch.midi)) return pitch.midi + accidental;
  if (typeof pitch === 'number') return 69 + 12 * Math.log2(pitch / 440) + accidental;
  const name = String(pitch).toUpperCase();
  const match = (SOLFEGE[name] || name).match(/^([A-G])([#B]?)(-?\d+)$/);
  if (!match) return null;
  return 12 * (Number(match[3]) + 1) + PITCH_CLASS[match[1]]
    + (match[2] === '#' ? 1 : match[2] === 'B' ? -1 : 0) + accidental;
}

const CHORDS = [
  [48, 55, 64], [50, 57, 65], [52, 59, 67],
  [53, 60, 69], [55, 62, 71], [45, 52, 60],
];

// Fit a diatonic chord to the longest melody notes in each measure; when a
// measure is chromatic, a quiet open fifth on its first pitch is less intrusive.
export function backingHarmony(notes, barSteps, totalSteps) {
  return Array.from({ length: Math.ceil(totalSteps / barSteps) }, (_, bar) => {
    const start = bar * barSteps;
    const pitches = notes.flatMap(note => {
      const midi = note.isRest ? null : toMidi(note.pitch, note.accidental || 0);
      const length = Math.min(start + barSteps, note.step + (note.duration || 4)) - Math.max(start, note.step);
      return midi != null && length > 0 ? [{ pc: midi % 12, length, step: note.step }] : [];
    });
    if (!pitches.length) return null;
    if (pitches.some(({ pc }) => ![0, 2, 4, 5, 7, 9, 11].includes(pc))) {
      const root = 48 + pitches[0].pc;
      return [root, root + 7];
    }
    const weight = chord => pitches.reduce((sum, note) => sum +
      (chord.some(pitch => pitch % 12 === note.pc) ? note.length * (note.step === start ? 1.5 : 1) : 0), 0);
    return CHORDS.reduce((best, chord) => weight(chord) > weight(best) ? chord : best);
  });
}
