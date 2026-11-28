import assert from 'node:assert/strict';
import test from 'node:test';
import { scorePage } from '../engine/ScoreLayout.js';

test('complete measures fit each width and the final partial page retains its scale', () => {
  for (const width of [205, 440, 850, 1440]) {
    const score = { width, indent: 86, barSteps: 16, bars: 31 };
    const first = scorePage({ ...score, anchorStep: 0 });
    const last = scorePage({ ...score, anchorStep: 495 });
    assert.ok(first.steps * first.stepWidth + score.indent <= width + 1e-8);
    assert.equal(last.stepWidth, first.stepWidth);
    assert.equal(last.start + last.steps, 496);
    assert.equal(last.page, last.pageCount - 1);
  }
});

test('the same global step stays visible after resizing and while following playback', () => {
  for (const width of [220, 850, 1800]) {
    const layout = scorePage({ width, indent: 86, barSteps: 12, bars: 32, anchorStep: 93.75 });
    assert.ok(layout.start <= 93.75 && 93.75 < layout.start + layout.steps);
  }
});

test('playback scrolls continuously while keeping the playhead ahead of the notes', () => {
  const score = { width: 850, indent: 86, barSteps: 16, bars: 32, follow: true };
  const before = scorePage({ ...score, anchorStep: 31.25 });
  const after = scorePage({ ...score, anchorStep: 31.5 });

  assert.ok(after.start > before.start);
  assert.ok(after.start - before.start <= 0.25);
  assert.ok(after.start <= 31.5 && 31.5 < after.start + after.steps);
  assert.ok(31.5 - after.start >= after.steps * 0.29);
  assert.ok(31.5 - after.start <= after.steps * 0.31);
});
