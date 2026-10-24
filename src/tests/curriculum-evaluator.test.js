import assert from 'assert';
import { ALL_LEVELS, RHYTHMIC_LEVELS, MELODIC_LEVELS } from '../data/curriculum.js';
import { RhythmEvaluator } from '../engine/RhythmEvaluator.js';
import { LevelManager } from '../engine/LevelManager.js';

console.log('--- STARTING RITMOLAB SYSTEM INTEGRITY TESTS ---');

// 1. Verify Curriculum counts
console.log('Testing Curriculum counts...');
assert.strictEqual(ALL_LEVELS.length, 88, 'Total levels must equal 88');
assert.strictEqual(RHYTHMIC_LEVELS.length, 48, 'Rhythmic levels must equal 48');
assert.strictEqual(MELODIC_LEVELS.length, 40, 'Melodic levels must equal 40');
console.log('✓ All 88 levels accounted for (48 rhythmic + 40 melodic).');

// 2. Verify Level structures
console.log('Testing Level data structures...');
ALL_LEVELS.forEach(lvl => {
  assert(lvl.id, 'Level must have an id');
  assert(lvl.title, `Level ${lvl.id} must have a title`);
  assert(lvl.description, `Level ${lvl.id} must have a description`);
  assert(lvl.section === 'rhythm' || lvl.section === 'melody', `Level ${lvl.id} section must be rhythm or melody`);
  assert(lvl.type, `Level ${lvl.id} must specify exercise type`);
  assert(lvl.totalSteps > 0, `Level ${lvl.id} totalSteps must be positive`);
  assert(lvl.staffType, `Level ${lvl.id} must specify staffType`);
});
console.log('✓ All level properties validated.');

// 3. Test RhythmEvaluator accuracy and ms calculation
console.log('Testing RhythmEvaluator...');
const testNotes = [
  { step: 0, duration: 4, sound: 'clap' },
  { step: 4, duration: 4, sound: 'clap' },
  { step: 8, duration: 4, sound: 'clap' },
  { step: 12, duration: 4, sound: 'clap' },
];

const evaluator = new RhythmEvaluator({ bpm: 60, tolerancePerfectMs: 80, toleranceGoodMs: 160 });
evaluator.loadScore(testNotes, 60, 4);

// At 60 BPM: 1 beat = 1000ms.
// Count-in = 4 beats = 4000ms.
// Beat 1: expected at 4000ms.
// Beat 2: expected at 5000ms.
// Beat 3: expected at 6000ms.
// Beat 4: expected at 7000ms.
assert.strictEqual(evaluator.expectedBeats.length, 4, 'Should have 4 playable expected beats');
assert.strictEqual(evaluator.expectedBeats[0].timeMs, 4000, 'First beat should be at 4000ms');
assert.strictEqual(evaluator.expectedBeats[1].timeMs, 5000, 'Second beat should be at 5000ms');

evaluator.start(0);

// Tap 1: at 4020ms (+20ms diff) -> should be 'perfect'
const tap1 = evaluator.registerTap(4020);
assert.strictEqual(tap1.rating, 'perfect', 'Tap 1 within 80ms should be perfect');

// Tap 2: at 5120ms (+120ms diff) -> should be 'good' (impreciso)
const tap2 = evaluator.registerTap(5120);
assert.strictEqual(tap2.rating, 'good', 'Tap 2 within 160ms should be good/impreciso');

// Beat 3 & 4 remain unplayed.
evaluator.updateCurrentTime(8000);
const finalStats = evaluator.finish();

assert.strictEqual(finalStats.perfectCount, 1, 'Should have 1 perfect');
assert.strictEqual(finalStats.goodCount, 1, 'Should have 1 good');
assert.strictEqual(finalStats.missedCount, 2, 'Should have 2 missed');
assert(finalStats.accuracy >= 0 && finalStats.accuracy <= 100, 'Accuracy must be percentage between 0 and 100');
console.log(`✓ RhythmEvaluator test passed: ${finalStats.perfectCount} perfect, ${finalStats.goodCount} good, ${finalStats.missedCount} missed -> Accuracy: ${finalStats.accuracy}%.`);

// 4. Test LevelManager progression
console.log('Testing LevelManager progression and export/import...');
// Mock localStorage in Node environment
const store = {};
global.localStorage = {
  getItem: (k) => store[k] || null,
  setItem: (k, v) => { store[k] = v; },
};

const lm = new LevelManager();
assert.strictEqual(lm.getLevelStatus('R1').unlocked, true, 'R1 must be unlocked initially');
assert.strictEqual(lm.getLevelStatus('M1').unlocked, true, 'M1 must be unlocked initially');

lm.recordLevelCompletion('R1', { stars: 3, accuracy: 95 });
assert.strictEqual(lm.getLevelStatus('R1').completed, true, 'R1 should be marked completed');
assert.strictEqual(lm.getLevelStatus('R1').stars, 3, 'R1 should have 3 stars');
assert.strictEqual(lm.getLevelStatus('R2').unlocked, true, 'R2 should be unlocked after R1 completion');

const exported = lm.exportDataAsJSON();
assert(exported.includes('R1'), 'Exported JSON should contain progress for R1');

const lm2 = new LevelManager();
const imported = lm2.importDataFromJSON(exported);
assert.strictEqual(imported, true, 'JSON import should succeed');
assert.strictEqual(lm2.getLevelStatus('R1').completed, true, 'Imported progress should have R1 completed');

console.log('✓ LevelManager test passed: unlock, persistence and backup verified.');
console.log('--- ALL RITMOLAB SYSTEM INTEGRITY TESTS PASSED! ---');
