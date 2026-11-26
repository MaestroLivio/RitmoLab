import assert from 'node:assert/strict';
import test from 'node:test';
import { backingHarmony, createTimeline, getMeter, toMidi } from '../engine/Transport.js';
import { groupBeams, splitNotation } from '../engine/Notation.js';
import { RhythmEvaluator } from '../engine/RhythmEvaluator.js';

test('count-in and note zero share the same clock in each supported meter', () => {
  for (const [signature, pulses, steps] of [['2/4', 2, 8], ['3/4', 3, 12], ['4/4', 4, 16], ['6/8', 2, 12]]) {
    const t = createTimeline(7, 120, signature, true);
    assert.equal(t.countAt(6.999), 0);
    assert.equal(t.countAt(7), pulses);
    assert.equal(t.timeAt(-steps), 7);
    assert.equal(t.countAt(t.musicStart - 0.001), 1);
    assert.equal(t.countAt(t.musicStart), 0);
    assert.equal(t.positionAt(t.musicStart), 0);
    assert.equal(t.timeAt(4), t.musicStart + 0.5);
    assert.equal(t.countAt(t.timeAt(-steps + getMeter(signature).pulseSteps)), pulses - 1);
  }
});

test('engraving splits at the bar but preserves duration, tying only sounded notes', () => {
  const parts = splitNotation({ step: 14, duration: 6 }, 16);
  assert.deepEqual(parts.map(p => [p.step, p.duration, p.tiedFrom, p.tiedTo]),
    [[14, 2, false, true], [16, 4, true, false]]);
  assert.ok(splitNotation({ step: 14, duration: 6, isRest: true }, 16).every(p => !p.tiedFrom && !p.tiedTo));
});

test('beams stay in the same pulse and voice, and break at rests', () => {
  const voice = [
    { step: 0, duration: 2 }, { step: 2, duration: 2 }, { step: 4, duration: 2, isRest: true },
    { step: 6, duration: 2 }, { step: 8, duration: 2 }, { step: 10, duration: 2 },
  ].map(note => ({ ...note, track: '1' }));
  assert.deepEqual(groupBeams([...voice, { step: 4, duration: 2, track: '2' }], '6/8')
    .map(group => group.map(note => note.step)), [[0, 2], [6, 8, 10]]);
});

test('enharmonic pitches are equivalent and MIDI preserves octaves', () => {
  assert.equal(toMidi('SI', -1), toMidi('A#4'));
  assert.equal(toMidi('DO_HIGH'), toMidi({ midi: 72 }));
  const evaluator = new RhythmEvaluator({ bpm: 120 });
  evaluator.loadScore([{ step: 0, pitch: 'SI', accidental: -1 }], 120, 0);
  evaluator.start(1000);
  assert.equal(evaluator.registerTap(1010, { midi: 70, label: 'Si♭' }).rating, 'perfect');
  evaluator.start(1000);
  assert.equal(evaluator.registerTap(1010, { midi: 58 }).rating, 'wrong_pitch');
});

test('rest-only bars stay silent and harmony follows the melody', () => {
  const harmony = backingHarmony([{ step: 0, pitch: 'FA', duration: 12 }, { step: 12, isRest: true }], 12, 24);
  assert.ok(harmony[0].some(pitch => pitch % 12 === 5));
  assert.equal(harmony[1], null);
});
