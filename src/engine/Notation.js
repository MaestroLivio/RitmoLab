import { getMeter } from './Transport.js';

const VALUES = [16, 12, 8, 6, 4, 3, 2, 1];

export function splitNotation(note, barSteps) {
  const parts = [];
  let step = note.step;
  if (!Number.isInteger(step) || step < 0 || !Number.isFinite(note.duration ?? 4) || barSteps <= 0) return parts;
  let left = Math.max(1, Math.floor(note.duration || 4));
  while (left > 0) {
    const available = Math.min(left, barSteps - (step % barSteps));
    const duration = VALUES.find(value => value <= available);
    parts.push({ step, duration, tiedFrom: !note.isRest && parts.length > 0, tiedTo: !note.isRest && left > duration });
    left -= duration;
    step += duration;
  }
  return parts;
}

export function groupBeams(notes, signature) {
  const { barSteps, pulseSteps } = getMeter(signature);
  const groups = [];
  const tracks = Map.groupBy
    ? Map.groupBy(notes, note => note.track)
    : notes.reduce((map, note) => map.set(note.track, [...(map.get(note.track) || []), note]), new Map());
  for (const track of tracks.values()) {
    let group = [];
    const append = () => { if (group.length >= 2) groups.push(group); group = []; };
    const slots = new Map();
    for (const note of track) slots.set(note.step, (slots.get(note.step) || 0) + 1);
    for (const note of [...track].sort((a, b) => a.step - b.step)) {
      const prev = group.at(-1);
      const pulse = step => Math.floor((step % barSteps) / pulseSteps);
      if (prev && (note.step !== prev.step + prev.duration || pulse(prev.step) !== pulse(note.step)
        || Math.floor(prev.step / barSteps) !== Math.floor(note.step / barSteps))) append();
      if (note.isRest || note.duration > 2 || slots.get(note.step) !== 1) append();
      else group.push(note);
    }
    append();
  }
  return groups;
}
