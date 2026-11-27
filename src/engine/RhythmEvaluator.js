/**
 * RhythmEvaluator.js - Real-time Rhythm & Melodic Tap Accuracy Engine
 * Evaluates user keypresses/clicks/MIDI against expected musical note timestamps and pitches.
 * Increased generous tolerances for primary school children.
 */

export class RhythmEvaluator {
  constructor(options = {}) {
    this.bpm = options.bpm || 90;
    // Generous default tolerances for primary school learners (±220ms for perfect, ±360ms for good)
    this.tolerancePerfectMs = options.tolerancePerfectMs !== undefined ? options.tolerancePerfectMs : 220;
    this.toleranceGoodMs = options.toleranceGoodMs !== undefined ? options.toleranceGoodMs : 360;
    this.startTime = 0;
    this.isRunning = false;
    this.expectedBeats = []; // Array of { id, step, timeMs, durationSteps, sound, pitch, accidental, matched, rating, diffMs }
    this.userTaps = [];      // Array of { timeMs, rating, diffMs, matchedId, playedPitch, expectedPitch }
    this.onTapFeedback = options.onTapFeedback || null;
    this.onMissedBeat = options.onMissedBeat || null;
  }

  setTolerances(perfectMs, goodMs) {
    if (perfectMs) this.tolerancePerfectMs = perfectMs;
    if (goodMs) this.toleranceGoodMs = goodMs;
  }

  /**
   * Pre-calculates target timestamps based on BPM and score tracks
   * @param {Array} notes - Array of note objects { id, step, duration, isRest, sound, pitch, accidental }
   * @param {number} bpm - Beats per minute
   * @param {number} countInBeats - Initial metronome count-in beats before playback (default: 4 beats)
   */
  loadScore(notes, bpm = 90, countInBeats = 4) {
    this.bpm = bpm;
    const msPerBeat = (60.0 / this.bpm) * 1000;
    const msPer16th = msPerBeat / 4.0;
    const countInMs = countInBeats * msPerBeat;

    this.msPer16th = msPer16th;
    this.msPerBeat = msPerBeat;

    // Filter out rests, keep only playable notes
    this.expectedBeats = notes
      .filter(n => !n.isRest)
      .map((n, idx) => ({
        id: n.id || `beat_${idx}`,
        step: n.step,
        timeMs: countInMs + (n.step * msPer16th),
        durationSteps: n.duration || 4,
        durationMs: (n.duration || 4) * msPer16th,
        sound: n.sound || 'clap',
        pitch: n.pitch || null,
        accidental: n.accidental || 0,
        matched: false,
        rating: null,
        diffMs: null,
        userTapTime: null,
        playedPitch: null,
      }))
      .sort((a, b) => a.timeMs - b.timeMs);

    this.userTaps = [];
    this.isRunning = false;
  }

  /**
   * Start evaluation timing
   */
  start(startTimeMs = performance.now()) {
    this.startTime = startTimeMs;
    this.isRunning = true;
    this.sungPitch = null;
    this.sungOnset = null;
    this.sungMatched = false;
    this.userTaps = [];
    // Reset all beats
    this.expectedBeats.forEach(b => {
      b.matched = false;
      b.rating = null;
      b.diffMs = null;
      b.userTapTime = null;
      b.playedPitch = null;
    });
  }

  isInputOpen(timeMs) {
    const first = this.expectedBeats[0];
    return this.isRunning && first != null
      && timeMs - this.startTime >= first.timeMs - this.toleranceGoodMs;
  }

  /**
   * Records a user tap (spacebar, touch/click on specific pitch, computer keyboard, or MIDI)
   * @param {number} tapTimeMs - Timestamp in ms
   * @param {string|null} playedPitch - Optional pitch played (e.g. 'DO', 'RE', 'MI', 'SOL', 'LA')
   */
  registerTap(tapTimeMs = performance.now(), playedPitch = null) {
    if (!this.isInputOpen(tapTimeMs)) return null;

    const elapsedMs = tapTimeMs - this.startTime;

    // Find the closest expected beat that hasn't been matched yet
    let closestBeat = null;
    let minDiff = Infinity;

    for (const beat of this.expectedBeats) {
      if (!beat.matched && beat.rating !== 'missed') {
        const diff = elapsedMs - beat.timeMs; // positive if late, negative if early
        if (Math.abs(diff) < Math.abs(minDiff)) {
          minDiff = diff;
          closestBeat = beat;
        }
      }
    }

    let rating = 'extra';
    let isPitchCorrect = true;

    if (closestBeat && Math.abs(minDiff) <= this.toleranceGoodMs) {
      closestBeat.matched = true;
      closestBeat.userTapTime = elapsedMs;
      closestBeat.diffMs = minDiff;
      closestBeat.playedPitch = playedPitch;

      // Check pitch match if pitch is expected and provided
      if (closestBeat.pitch) {
        isPitchCorrect = playedPitch != null &&
          toMidi(closestBeat.pitch, closestBeat.accidental) === toMidi(playedPitch);
      } else if (playedPitch) {
        isPitchCorrect = closestBeat.sound === playedPitch;
      }

      if (!isPitchCorrect) {
        rating = 'wrong_pitch'; // Nota errata
        closestBeat.rating = 'wrong_pitch';
      } else if (Math.abs(minDiff) <= this.tolerancePerfectMs) {
        rating = 'perfect'; // Perfetto!
        closestBeat.rating = 'perfect';
      } else {
        rating = 'good'; // Impreciso ma a tempo
        closestBeat.rating = 'good';
      }
    } else {
      rating = 'extra'; // Pressione a vuoto / fuori tempo
    }

    const tapRecord = {
      timeMs: elapsedMs,
      diffMs: closestBeat ? minDiff : null,
      rating,
      isPitchCorrect,
      matchedId: closestBeat?.id || null,
      expectedPitch: closestBeat?.pitch || closestBeat?.sound || null,
      playedPitch: playedPitch?.label ?? playedPitch ?? closestBeat?.sound ?? 'clap',
      timingText: minDiff > 0 ? `+${Math.round(minDiff)}ms` : `${Math.round(minDiff)}ms`,
    };

    this.userTaps.push(tapRecord);

    if (this.onTapFeedback) {
      this.onTapFeedback(tapRecord);
    }

    return tapRecord;
  }

  /**
   * Evaluates sung pitch from microphone detection in real time.
   * Specifically tailored for untrained children's choir (duration window, octave invariance, cent tolerance).
   */
  registerSingingDetection(currentTimeMs = performance.now(), detectedPitch = null) {
    if (!this.isRunning) return null;
    if (!detectedPitch || detectedPitch.isSilent) {
      this.sungPitch = null;
      return null;
    }
    if (!detectedPitch.isConfident) return null;

    const elapsedMs = currentTimeMs - this.startTime;
    const sung = detectedPitch.midi ?? toMidi(detectedPitch.scientific || detectedPitch.solfegeKey);
    if (sung == null) return null;
    const pitchClass = ((Math.round(sung) % 12) + 12) % 12;
    if (pitchClass !== this.sungPitch) {
      this.sungPitch = pitchClass;
      this.sungOnset = elapsedMs;
      this.sungMatched = false;
    }
    if (this.sungMatched || !this.isInputOpen(currentTimeMs)) return null;

    // Find candidate beats active in their window (including sustained duration + tolerance)
    const candidateBeats = this.expectedBeats.filter(b => {
      if (!b.pitch || b.matched || b.rating === 'missed') return false;
      const noteDur = b.durationMs || ((b.durationSteps || 4) * (this.msPer16th || 150));
      const windowStart = b.timeMs - this.toleranceGoodMs;
      const windowEnd = b.timeMs + noteDur + this.toleranceGoodMs;
      return this.sungOnset >= windowStart && elapsedMs <= windowEnd;
    });

    if (candidateBeats.length === 0) return null;

    // Sort: prefer unmatched beats first, then closest in time
    candidateBeats.sort((a, b) => {
      return Math.abs(this.sungOnset - a.timeMs) - Math.abs(this.sungOnset - b.timeMs);
    });

    const beat = candidateBeats.find(item => {
      const expected = toMidi(item.pitch, item.accidental);
      return expected != null && expected % 12 === pitchClass;
    });

    if (beat) {
      const diffMs = this.sungOnset - beat.timeMs;
      this.sungMatched = true;
      beat.matched = true;
      beat.userTapTime = elapsedMs;
      beat.diffMs = diffMs;
      beat.playedPitch = detectedPitch.solfegeLabel || detectedPitch.noteName || beat.pitch;

      const centsAbs = Math.abs(detectedPitch.cents || 0);
      const rating = (Math.abs(diffMs) <= this.tolerancePerfectMs && centsAbs <= 45)
        ? 'perfect'
        : 'good';
      beat.rating = rating;

      const record = {
        timeMs: elapsedMs,
        diffMs,
        rating,
        isPitchCorrect: true,
        matchedId: beat.id,
        expectedPitch: beat.pitch,
        playedPitch: beat.playedPitch,
        timingText: diffMs > 0 ? `+${Math.round(diffMs)}ms` : `${Math.round(diffMs)}ms`,
        isSinging: true,
      };

      this.userTaps.push(record);
      if (this.onTapFeedback) {
        this.onTapFeedback(record);
      }
      return record;
    }

    return null;
  }

  /**
   * Periodically check for notes that were missed (passed time + full duration + toleranceGoodMs)
   */
  updateCurrentTime(currentTimeMs = performance.now()) {
    if (!this.isRunning) return;
    const elapsedMs = currentTimeMs - this.startTime;

    this.expectedBeats.forEach(beat => {
      if (!beat.matched && !beat.rating) {
        const noteDurationMs = beat.durationMs || ((beat.durationSteps || 4) * (this.msPer16th || 150));
        const expirationTime = beat.timeMs + noteDurationMs + this.toleranceGoodMs;
        if (elapsedMs > expirationTime) {
          beat.rating = 'missed'; // Mancato dopo la fine della durata della nota
          if (this.onMissedBeat) {
            this.onMissedBeat(beat);
          }
        }
      }
    });
  }

  /**
   * Finalizes the session and computes overall statistics and stars
   */
  finish() {
    this.isRunning = false;

    // Mark any remaining unmatched as missed
    this.expectedBeats.forEach(beat => {
      if (!beat.matched && !beat.rating) {
        beat.rating = 'missed';
      }
    });

    const total = this.expectedBeats.length;
    if (total === 0) {
      return {
        accuracy: 100,
        stars: 3,
        total: 0,
        perfectCount: 0,
        goodCount: 0,
        wrongPitchCount: 0,
        missedCount: 0,
        extraCount: this.userTaps.filter(t => t.rating === 'extra').length,
        verdict: 'Ottimo lavoro!',
      };
    }

    const perfectCount = this.expectedBeats.filter(b => b.rating === 'perfect').length;
    const goodCount = this.expectedBeats.filter(b => b.rating === 'good').length;
    const wrongPitchCount = this.expectedBeats.filter(b => b.rating === 'wrong_pitch').length;
    const missedCount = this.expectedBeats.filter(b => b.rating === 'missed').length;
    const extraCount = this.userTaps.filter(t => t.rating === 'extra').length;

    // Score calculation with generous curves for primary school
    let rawScore = (perfectCount * 100 + goodCount * 70 + wrongPitchCount * 40) / total;
    rawScore = Math.max(0, rawScore - (extraCount * 2));
    const accuracy = Math.round(Math.min(100, rawScore));

    let stars = 1;
    let verdict = 'Continua a esercitarti! Puoi fare di meglio.';

    if (accuracy >= 80) {
      stars = 3;
      verdict = 'Fantastico! Ritmo e note perfette da vero maestro!';
    } else if (accuracy >= 60) {
      stars = 2;
      verdict = 'Molto bene! Buon senso del tempo!';
    } else if (accuracy >= 35) {
      stars = 1;
      verdict = 'Buon tentativo! Riprova per ottenere più stelle.';
    } else {
      stars = 0;
      verdict = 'Ascolta la versione corretta e riprova!';
    }

    return {
      accuracy,
      stars,
      total,
      perfectCount,
      goodCount,
      wrongPitchCount,
      missedCount,
      extraCount,
      verdict,
      beats: this.expectedBeats,
    };
  }
}
import { toMidi } from './Transport.js';
