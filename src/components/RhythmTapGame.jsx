import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  Play,
  RotateCcw,
  Star,
  Trophy,
  Volume2,
  CheckCircle,
  AlertTriangle,
  XCircle,
  ArrowRight,
  Sparkles,
  Award,
  Keyboard,
  Music,
  Mic,
  MicOff
} from 'lucide-react';
import { RhythmEvaluator } from '../engine/RhythmEvaluator';
import { audioEngine, SOLFEGE_MAP } from '../engine/AudioEngine';
import { midiManager } from '../engine/MidiManager';
import { settingsManager } from '../engine/SettingsManager';
import { pitchDetector } from '../engine/PitchDetector';
import KodalyHandSign, { KODALY_SIGNS_DATA } from './KodalyHandSign';

// Keyboard mappings for Melodic Tap
const KEYBOARD_PITCH_MAP = {
  'KeyA': 'DO', 'Digit1': 'DO',
  'KeyS': 'RE', 'Digit2': 'RE',
  'KeyD': 'MI', 'Digit3': 'MI',
  'KeyF': 'FA', 'Digit4': 'FA',
  'KeyG': 'SOL', 'Digit5': 'SOL',
  'KeyH': 'LA', 'Digit6': 'LA',
  'KeyJ': 'SI', 'Digit7': 'SI',
  'KeyK': 'DO_HIGH', 'Digit8': 'DO_HIGH',
};

// Keyboard mappings for Rhythmic Body Percussion & Orff Tap
const KEYBOARD_RHYTHM_MAP = {
  'KeyZ': 'feet', 'Digit1': 'feet',
  'KeyX': 'thighs', 'Digit2': 'thighs',
  'KeyC': 'chest', 'Digit3': 'chest',
  'KeyV': 'clap', 'Digit4': 'clap',
  'KeyB': 'snap', 'Digit5': 'snap',
  'KeyN': 'claves', 'Digit6': 'claves',
  'KeyM': 'tambourine', 'Digit7': 'tambourine',
  'Comma': 'triangle', 'Digit8': 'triangle',
  'Period': 'cymbals', 'Digit9': 'cymbals',
};

const ALL_PITCH_KEYS = ['DO', 'RE', 'MI', 'FA', 'SOL', 'LA', 'SI', 'DO_HIGH'];

// Vertical Y coordinates for Pentagram Staff (5 lines + ledger line for Do4)
// Shifted down to give the staff comfortable headroom at the top and bottom so
// note stems and the ledger-line Do never clip against the container edges.
const PITCH_STAFF_Y = {
  'FA_HIGH': 48, 'F5': 48,
  'MI_HIGH': 60, 'E5': 60,
  'RE_HIGH': 72, 'D5': 72,
  'DO_HIGH': 84, 'C5': 84,
  'SI': 96, 'B4': 96,
  'LA': 108, 'A4': 108,
  'SOL': 120, 'G4': 120,
  'FA': 132, 'F4': 132,
  'MI': 144, 'E4': 144,
  'RE': 156, 'D4': 156,
  'DO': 168, 'C4': 168, // Ledger line below
};

// The 5 staff lines (E4, G4, B4, D5, F5) 24px apart, matching PITCH_STAFF_Y.
const STAFF_LINES = [48, 72, 96, 120, 144];

// Vertical Y coordinates for Rhythmic Tracks
const RHYTHM_TRACK_Y = {
  'snap': 32,
  'triangle': 32,
  'clap': 68,
  'claves': 68,
  'chest': 104,
  'tambourine': 104,
  'thighs': 140,
  'cymbals': 140,
  'feet': 176,
};

export default function RhythmTapGame({
  level,
  onComplete = null,
  onNextLevel = null,
  onBackToEditor = null,
}) {
  const [gameState, setGameState] = useState('ready'); // 'ready' | 'counting' | 'playing' | 'finished'
  const [inputMode, setInputMode] = useState('tap'); // 'tap' | 'singing'
  const [micActive, setMicActive] = useState(false);
  const [livePitch, setLivePitch] = useState(null);

  const [countInBeat, setCountInBeat] = useState(4);
  const [evaluator, setEvaluator] = useState(null);
  const [recentTapFeedback, setRecentTapFeedback] = useState(null);
  const [combo, setCombo] = useState(0);
  const [result, setResult] = useState(null);
  const [currentTimeMs, setCurrentTimeMs] = useState(0);
  const [activePressedPitch, setActivePressedPitch] = useState(null);
  const [midiDevices, setMidiDevices] = useState(midiManager.getConnectedDevices());

  const inputModeRef = useRef(inputMode);
  inputModeRef.current = inputMode;
  const micActiveRef = useRef(micActive);
  micActiveRef.current = micActive;

  const animationFrameRef = useRef(null);
  const startTimeRef = useRef(0);
  const evaluatorRef = useRef(null);

  const isMelodic = level?.section === 'melody';
  const bpm = level?.bpm || 85;
  const countInBeats = 4;
  const msPerBeat = (60.0 / bpm) * 1000;
  const totalDurationMs = (countInBeats * msPerBeat) + ((level?.totalSteps || 16) * (msPerBeat / 4.0)) + 600;

  // Filter keys based on current level's allowed pitches or show all
  const activePitchKeys = React.useMemo(() => {
    if (isMelodic && level?.allowedPitches && level.allowedPitches.length > 0) {
      // In Modulo 1: SOL, MI, LA; in Modulo 2: DO, RE, MI, SOL, LA; in Modulo 3+: all
      const allowed = level.allowedPitches;
      return ALL_PITCH_KEYS.filter(k => allowed.includes(k) || (k === 'DO_HIGH' && allowed.includes('DO_HIGH')));
    }
    return ALL_PITCH_KEYS;
  }, [isMelodic, level]);

  // Initialize evaluator when level changes
  useEffect(() => {
    if (!level) return;

    // Get generous timing tolerances from settingsManager
    const toleranceConfig = settingsManager.getToleranceValues();

    const targetNotes = level.targetNotes || [];
    const evalInstance = new RhythmEvaluator({
      bpm,
      tolerancePerfectMs: toleranceConfig.perfectMs, // e.g. 240ms generous
      toleranceGoodMs: toleranceConfig.goodMs,       // e.g. 380ms generous
      onTapFeedback: (feedback) => {
        setRecentTapFeedback(feedback);
        if (feedback.rating === 'perfect') {
          setCombo(c => c + 1);
          audioEngine.playFeedbackSound('perfect');
        } else if (feedback.rating === 'good') {
          setCombo(c => c + 1);
          audioEngine.playFeedbackSound('good');
        } else {
          setCombo(0);
        }
      },
      onMissedBeat: () => {
        setCombo(0);
      }
    });

    evalInstance.loadScore(targetNotes, bpm, countInBeats);
    setEvaluator(evalInstance);
    evaluatorRef.current = evalInstance;

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      audioEngine.stopPlayback();
    };
  }, [level, bpm]);

  // Handle User Tap on a specific pitch or rhythmic sound
  const handlePitchTap = useCallback((pitchOrSound) => {
    if (gameState !== 'playing' || !evaluatorRef.current) return;

    setActivePressedPitch(pitchOrSound);
    setTimeout(() => setActivePressedPitch(null), 180);

    // Audition sound procedurally
    if (isMelodic) {
      audioEngine.playNote(pitchOrSound, 0.4);
    } else {
      audioEngine.playSoundByName(pitchOrSound);
    }

    // Register tap in evaluator with pitch match
    evaluatorRef.current.registerTap(performance.now(), pitchOrSound);
  }, [gameState, isMelodic]);

  // Universal tap (Spacebar)
  const handleUniversalTap = useCallback(() => {
    if (gameState !== 'playing' || !evaluatorRef.current) return;
    evaluatorRef.current.registerTap(performance.now(), null);
  }, [gameState]);

  // Keyboard listener for Spacebar, letters (A, S, D, F, G, H, J, K), and digits (1-8)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.repeat) return;

      if (e.code === 'Space') {
        e.preventDefault();
        if (gameState === 'ready') {
          startSession();
        } else if (gameState === 'playing') {
          handleUniversalTap();
        }
        return;
      }

      if (gameState === 'playing') {
        if (isMelodic && KEYBOARD_PITCH_MAP[e.code]) {
          e.preventDefault();
          handlePitchTap(KEYBOARD_PITCH_MAP[e.code]);
        } else if (!isMelodic && KEYBOARD_RHYTHM_MAP[e.code]) {
          e.preventDefault();
          handlePitchTap(KEYBOARD_RHYTHM_MAP[e.code]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, isMelodic, handleUniversalTap, handlePitchTap]);

  // External MIDI Keyboard listener
  useEffect(() => {
    const unsubMidi = midiManager.onNote((noteData) => {
      if (gameState === 'playing') {
        handlePitchTap(noteData.solfege);
      }
    });

    const unsubMidiStatus = midiManager.onStatusChange((devices) => {
      setMidiDevices(devices);
    });

    return () => {
      unsubMidi();
      unsubMidiStatus();
    };
  }, [gameState, handlePitchTap]);

  // Microphone toggle & cleanup
  const toggleMicrophone = async () => {
    if (micActive) {
      pitchDetector.stop();
      setMicActive(false);
      setLivePitch(null);
    } else {
      try {
        await pitchDetector.start((pitch) => {
          setLivePitch(pitch);
        });
        setMicActive(true);
      } catch (err) {
        alert('Impossibile accedere al microfono. Verifica che i permessi audio siano concessi al browser o al sistema.');
      }
    }
  };

  useEffect(() => {
    return () => {
      pitchDetector.stop();
    };
  }, []);

  const handlePlayReferencePitch = () => {
    const p = level?.targetNotes?.find(n => !n.isRest && n.pitch)?.pitch || 'DO';
    audioEngine.playReferencePitch(p, 2.5);
  };

  // Start Count-in and Game Session
  const startSession = () => {
    if (!evaluatorRef.current) return;
    setGameState('counting');
    setResult(null);
    setCombo(0);
    setRecentTapFeedback(null);

    const firstPitch = level?.targetNotes?.find(n => !n.isRest && n.pitch)?.pitch || 'DO';
    // If in singing mode, play the starting intonation pitch during count-in so choir tunes up!
    if (isMelodic && inputMode === 'singing') {
      audioEngine.playReferencePitch(firstPitch, (countInBeats * msPerBeat * 0.9) / 1000);
    }

    // Audio metronome for count-in: 4 beats
    let currentCount = countInBeats;
    setCountInBeat(currentCount);
    audioEngine.playMetronome(1);

    const countInterval = setInterval(() => {
      currentCount--;
      if (currentCount > 0) {
        setCountInBeat(currentCount);
        audioEngine.playMetronome(currentCount === 4 ? 1 : 2);
      } else {
        clearInterval(countInterval);
        launchPlayback();
      }
    }, msPerBeat);
  };

  const launchPlayback = async () => {
    setGameState('playing');
    const startMs = performance.now();
    startTimeRef.current = startMs;
    evaluatorRef.current.start(startMs - (countInBeats * msPerBeat));

    if (inputModeRef.current === 'singing' && !micActiveRef.current) {
      try {
        await toggleMicrophone();
      } catch (err) {
        console.warn('Microphone activation notice:', err);
      }
    }

    // Play backing track / metronome with harmonic accompaniment for choir singing
    const score = {
      bpm,
      totalSteps: level.totalSteps || 16,
      playMetronome: true,
      harmonicAccompaniment: isMelodic && inputModeRef.current === 'singing',
      tracks: [
        {
          notes: level.targetNotes || [],
        }
      ]
    };
    audioEngine.startScorePlayback(score);

    // Animation / evaluation tick loop
    const tick = () => {
      const now = performance.now();
      const elapsed = now - startMs;
      setCurrentTimeMs(elapsed);

      if (evaluatorRef.current) {
        // Real-time microphone singing detection for children's choir
        if (inputModeRef.current === 'singing' && micActiveRef.current && pitchDetector.latestPitch) {
          const hit = evaluatorRef.current.registerSingingDetection(now, pitchDetector.latestPitch);
          if (hit) {
            setCombo(c => c + 1);
            audioEngine.playFeedbackSound(hit.rating === 'perfect' ? 'perfect' : 'good');
          }
        }
        evaluatorRef.current.updateCurrentTime(now);
      }

      if (elapsed >= (totalDurationMs - (countInBeats * msPerBeat))) {
        finishSession();
      } else {
        animationFrameRef.current = requestAnimationFrame(tick);
      }
    };

    animationFrameRef.current = requestAnimationFrame(tick);
  };

  const finishSession = () => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    audioEngine.stopPlayback();

    if (evaluatorRef.current) {
      const finalResult = evaluatorRef.current.finish();
      setResult(finalResult);
      setGameState('finished');

      if (finalResult.stars >= 1) {
        audioEngine.playSuccessFanfare();
        confetti({
          particleCount: finalResult.stars === 3 ? 120 : 60,
          spread: 75,
          origin: { y: 0.6 },
          colors: ['#FDE047', '#38BDF8', '#34D399', '#F472B6', '#A855F7']
        });

        if (onComplete) {
          onComplete({
            levelId: level.id,
            stars: finalResult.stars,
            accuracy: finalResult.accuracy,
          });
        }
      }
    }
  };

  const [isPlayingTarget, setIsPlayingTarget] = useState(false);

  const handlePlayTarget = () => {
    if (isPlayingTarget) {
      audioEngine.stopPlayback();
      setIsPlayingTarget(false);
      return;
    }
    setIsPlayingTarget(true);
    audioEngine.setBpm(bpm);
    const score = {
      bpm,
      totalSteps: level.totalSteps || 16,
      playMetronome: true,
      tracks: [
        { notes: level.targetNotes || [] },
        ...(level.targetNotesTrack2 ? [{ notes: level.targetNotesTrack2 }] : [])
      ]
    };
    audioEngine.startScorePlayback(score, null, () => setIsPlayingTarget(false));
  };

  return (
    <div className="flex flex-col h-full bg-montessori-cream rounded-3xl border-2 border-amber-200/90 shadow-playful p-6 overflow-hidden select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b-2 border-amber-100 flex-shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-amber-800 uppercase tracking-wider bg-amber-100 px-2.5 py-1 rounded-full">
              {isMelodic ? '🎹 Tap Melodico (Touch, Tastiera & MIDI)' : '🥁 Rhythm Tap (Esegui il Ritmo)'}
            </span>

            {/* MIDI Status Indicator Pill */}
            {midiDevices.length > 0 ? (
              <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>MIDI USB: {midiDevices[0].name}</span>
              </span>
            ) : (
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                <span>🎹 MIDI Pronto</span>
              </span>
            )}
          </div>

          <h2 className="text-xl font-black text-slate-800 mt-1">{level.title}</h2>
          <p className="text-xs text-slate-600 mt-0.5">{level.description}</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-xs font-bold text-slate-500">Velocità</span>
            <div className="text-base font-black text-amber-900">{bpm} BPM</div>
          </div>
          {onBackToEditor && (
            <button
              onClick={() => {
                if (isPlayingTarget) audioEngine.stopPlayback();
                onBackToEditor();
              }}
              className="btn-playful px-4 py-2 bg-white text-slate-700 border border-amber-200 text-xs hover:bg-amber-50"
            >
              Torna all'Editor
            </button>
          )}
        </div>
      </div>

      {/* Main Game Stage */}
      <div className="flex-1 flex flex-col items-center justify-center relative py-4 overflow-y-auto">
        {gameState === 'ready' && (
          <div className="text-center max-w-lg p-6 bg-white rounded-3xl shadow-playful border border-amber-100 animate-fade-in my-auto">
            <div className="w-16 h-16 mx-auto mb-3 bg-amber-100 rounded-full flex items-center justify-center text-3xl shadow-inner">
              {isMelodic ? '🎹' : '🥁'}
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-1">{level.title}</h3>

            {/* Didactic Explanation Box */}
            <div className="text-left bg-amber-50/70 p-3.5 rounded-2xl border border-amber-200 mb-4 space-y-2 text-xs">
              <div>
                <span className="font-black text-amber-900 block">🎯 Obiettivo dell'Esercizio:</span>
                <span className="text-slate-700 font-medium">
                  {level.explanation?.goal || level.description}
                </span>
              </div>
              <div>
                <span className="font-black text-amber-900 block">🗣️ Guida Vocale (Come Contare):</span>
                <span className="text-slate-700 font-medium">
                  {level.explanation?.howToCount || (isMelodic ? "Canta le note con sillabe Kodály (Sol, Mi, La...)" : "Conta a tempo con sillabe Kodály (Ta, Ti-Ti).")}
                </span>
              </div>
            </div>

            {isMelodic && (
              <div className="flex items-center gap-2 mb-3 bg-amber-100/70 p-1.5 rounded-2xl border border-amber-200">
                <button
                  type="button"
                  onClick={() => setInputMode('tap')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    inputMode === 'tap'
                      ? 'bg-white text-amber-950 shadow-playful-sm border border-amber-300'
                      : 'text-amber-800 hover:bg-white/50'
                  }`}
                >
                  <Keyboard className="w-4 h-4" />
                  <span>🎹 Tasti / Touch / MIDI</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode('singing')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    inputMode === 'singing'
                      ? 'bg-purple-600 text-white shadow-playful-sm border border-purple-700'
                      : 'text-amber-800 hover:bg-white/50'
                  }`}
                >
                  <Mic className="w-4 h-4" />
                  <span>🎤 Modalità Canto (Microfono)</span>
                </button>
              </div>
            )}

            {/* Prendi l'Intonazione Cue Box (Melodic exercises) */}
            {isMelodic && (
              <div className="w-full bg-gradient-to-r from-purple-50 via-indigo-50 to-pink-50 border-2 border-purple-200 rounded-2xl p-3 mb-4 text-left flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-purple-500 text-white flex items-center justify-center font-black text-lg shadow-sm">
                    🎵
                  </div>
                  <div>
                    <span className="text-xs font-black text-purple-900 block">
                      Momento Intonazione (Prendi la nota di partenza):
                    </span>
                    <span className="text-[11px] font-semibold text-purple-700">
                      La prima nota del brano è <strong className="underline uppercase">{level?.targetNotes?.find(n => !n.isRest && n.pitch)?.pitch || 'DO'}</strong>. Ascoltala per accordare la voce!
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handlePlayReferencePitch}
                  className="btn-playful px-3.5 py-2 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white text-xs font-black rounded-xl shadow-playful-sm flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>Ascolta Nota di Partenza 🔊</span>
                </button>
              </div>
            )}

            <div className="text-xs text-slate-600 mb-4 p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-left">
              <span className="font-bold text-slate-800 block mb-1">🎮 Modalità di esecuzione:</span>
              <ul className="space-y-1 list-disc list-inside">
                {isMelodic && (
                  <li>
                    <strong>🎤 Canto al Microfono:</strong> canta con la tua voce o con il coro dei bambini, il microfono riconosce l'altezza e il tempo in modo adattivo!
                  </li>
                )}
                <li><strong>Touch / Click:</strong> tocca le barre musicali colorate sullo schermo.</li>
                <li><strong>Tastiera Computer:</strong> premi i tasti <kbd className="bg-white border px-1 rounded">A</kbd> <kbd className="bg-white border px-1 rounded">S</kbd> <kbd className="bg-white border px-1 rounded">D</kbd> <kbd className="bg-white border px-1 rounded">F</kbd> o i numeri <kbd className="bg-white border px-1 rounded">1-8</kbd>.</li>
                <li><strong>Tastiera MIDI:</strong> collega qualsiasi pianoforte o tastiera USB!</li>
              </ul>
            </div>

            {/* Action Buttons: Listen Correct Version + Start Game */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={handlePlayTarget}
                className={`btn-playful flex-1 w-full py-3.5 text-xs font-black rounded-2xl flex items-center justify-center gap-2 border transition-all ${
                  isPlayingTarget
                    ? 'bg-rose-500 text-white border-rose-600 animate-pulse'
                    : 'bg-amber-100 hover:bg-amber-200 text-amber-950 border-amber-300'
                }`}
              >
                <Volume2 className="w-4 h-4" />
                <span>{isPlayingTarget ? 'Ferma Esempio' : 'Ascolta Versione Corretta'}</span>
              </button>

              <button
                onClick={() => {
                  if (isPlayingTarget) {
                    audioEngine.stopPlayback();
                    setIsPlayingTarget(false);
                  }
                  startSession();
                }}
                className="btn-playful flex-1 w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-black rounded-2xl flex items-center justify-center gap-2 shadow-emerald-200"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Inizia Esercizio</span>
              </button>
            </div>
          </div>
        )}

        {(gameState === 'playing' || gameState === 'counting') && (
          <div className="w-full max-w-3xl flex flex-col items-center my-auto relative">
            {/* Countdown badge during count-in: the whole game stage is already
                visible so pupils can spot the hit zone and the input buttons
                before the metronome count finishes. */}
            {gameState === 'counting' && (
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center animate-bounce-short">
                <div className="text-xs font-black text-amber-800 uppercase tracking-widest mb-1.5 whitespace-nowrap px-3 py-1 bg-white/95 rounded-full border border-amber-200 shadow-xs">
                  {isMelodic && inputMode === 'singing'
                    ? "🎶 Prendi l'intonazione e preparati..."
                    : 'Ascolta il conteggio del metronomo...'}
                </div>
                <div className="w-24 h-24 bg-amber-400 text-amber-950 font-black text-6xl rounded-full flex items-center justify-center shadow-playful border-4 border-amber-300">
                  {countInBeat}
                </div>
                <div className="mt-2 text-[11px] font-black text-slate-700 bg-white/95 px-3 py-1 rounded-full border border-amber-200 shadow-xs whitespace-nowrap">
                  👀 Le note arrivano qui: al via suona a ritmo!
                </div>
              </div>
            )}

            {/* Combo & Live Feedback */}
            <div className="h-16 flex flex-col items-center justify-center mb-3">
              {recentTapFeedback && (
                <div
                  className={`text-xl font-black px-6 py-2 rounded-2xl shadow-playful animate-bounce-short flex items-center gap-2 ${
                    recentTapFeedback.rating === 'perfect'
                      ? 'bg-emerald-100 text-emerald-800 border-2 border-emerald-300'
                      : recentTapFeedback.rating === 'good'
                      ? 'bg-amber-100 text-amber-800 border-2 border-amber-300'
                      : recentTapFeedback.rating === 'wrong_pitch'
                      ? 'bg-purple-100 text-purple-800 border-2 border-purple-300'
                      : 'bg-rose-100 text-rose-800 border-2 border-rose-300'
                  }`}
                >
                  {recentTapFeedback.rating === 'perfect' && <span>⭐ PERFETTO!</span>}
                  {recentTapFeedback.rating === 'good' && <span>👍 A TEMPO ({recentTapFeedback.timingText})</span>}
                  {recentTapFeedback.rating === 'wrong_pitch' && (
                    <span>⚠️ NOTA: {recentTapFeedback.playedPitch} anziché {recentTapFeedback.expectedPitch}</span>
                  )}
                  {recentTapFeedback.rating === 'extra' && <span>⚠️ FUORI TEMPO</span>}
                </div>
              )}
              {combo > 2 && (
                <div className="text-xs font-black text-purple-700 uppercase tracking-wider mt-1">
                  🔥 Combo: {combo} note consecutive corrette!
                </div>
              )}
            </div>

            {/* Input Mode Toggle & Microphone Vocal Tuner (Melodic Mode) */}
            {isMelodic && (
              <div className="w-full flex flex-col gap-2 mb-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 bg-amber-100/70 p-1 rounded-2xl border border-amber-200">
                    <button
                      type="button"
                      onClick={() => {
                        setInputMode('tap');
                        if (micActive) toggleMicrophone();
                      }}
                      className={`py-1.5 px-3 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                        inputMode === 'tap'
                          ? 'bg-white text-amber-950 shadow-playful-sm border border-amber-300'
                          : 'text-amber-800 hover:bg-white/50'
                      }`}
                    >
                      <Keyboard className="w-3.5 h-3.5" />
                      <span>🎹 Tasti / MIDI</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setInputMode('singing');
                        if (!micActive) toggleMicrophone();
                      }}
                      className={`py-1.5 px-3 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                        inputMode === 'singing'
                          ? 'bg-purple-600 text-white shadow-playful-sm border border-purple-700'
                          : 'text-amber-800 hover:bg-white/50'
                      }`}
                    >
                      <Mic className="w-3.5 h-3.5" />
                      <span>🎤 Modalità Canto (Microfono)</span>
                    </button>
                  </div>

                  {inputMode === 'singing' && (
                    <button
                      type="button"
                      onClick={toggleMicrophone}
                      className={`btn-playful py-1.5 px-3 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer border ${
                        micActive
                          ? 'bg-rose-500 hover:bg-rose-600 text-white border-rose-600'
                          : 'bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-600'
                      }`}
                    >
                      {micActive ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                      <span>{micActive ? 'Spegni Microfono' : 'Attiva Microfono'}</span>
                    </button>
                  )}
                </div>

                {/* Real-time Voice Tuner Banner for Choir */}
                {inputMode === 'singing' && (
                  <div className="w-full bg-purple-50/90 border-2 border-purple-200 rounded-2xl px-3 py-2 flex items-center justify-between gap-2 shadow-2xs">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${micActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                      <span className="text-xs font-black text-purple-950">
                        {micActive ? 'Microfono Coro Attivo' : 'Microfono Non Attivo'}
                      </span>
                      <button
                        type="button"
                        onClick={handlePlayReferencePitch}
                        title="Riascolta la nota di partenza"
                        className="btn-playful px-2 py-0.5 bg-purple-200 hover:bg-purple-300 active:bg-purple-400 text-purple-900 text-[10px] font-black rounded-lg flex items-center gap-1 border border-purple-300 cursor-pointer shadow-2xs ml-1"
                      >
                        <Volume2 className="w-3 h-3" />
                        <span>Ascolta Intonazione 🔔</span>
                      </button>
                    </div>

                    {micActive ? (
                      livePitch && livePitch.isConfident ? (
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5">
                            <span
                              className="w-5 h-5 rounded-full text-white text-[10px] font-black flex items-center justify-center shadow-xs"
                              style={{ backgroundColor: livePitch.color || '#8B5CF6' }}
                            >
                              {livePitch.solfegeLabel?.slice(0, 2)}
                            </span>
                            <span className="text-xs font-black text-slate-800">
                              {livePitch.solfegeLabel} ({livePitch.scientific})
                            </span>
                            <span className="text-[10px] text-slate-500 font-bold hidden sm:inline">
                              {livePitch.frequency} Hz
                            </span>
                          </div>

                          {/* Cent Tuner Bar */}
                          <div className="flex items-center gap-1">
                            <span className="text-[9px] font-bold text-slate-400">♭</span>
                            <div className="w-16 h-2 bg-slate-200 rounded-full relative overflow-hidden">
                              <div
                                className="absolute top-0 bottom-0 w-2 rounded-full transition-all duration-75"
                                style={{
                                  left: `${Math.max(0, Math.min(100, 50 + (livePitch.cents || 0)))}%`,
                                  backgroundColor: Math.abs(livePitch.cents || 0) <= 35 ? '#10B981' : '#F59E0B',
                                }}
                              />
                              <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-[1px] bg-slate-400" />
                            </div>
                            <span className="text-[9px] font-bold text-slate-400">♯</span>
                          </div>

                          <span
                            className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                              Math.abs(livePitch.cents || 0) <= 35
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-amber-100 text-amber-800 border border-amber-200'
                            }`}
                          >
                            {Math.abs(livePitch.cents || 0) <= 35 ? 'Intonato! ⭐' : 'A tono 👍'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs font-semibold text-purple-700 animate-pulse">
                          🗣️ In ascolto del coro... Canta le note a tempo!
                        </span>
                      )
                    ) : (
                      <span className="text-xs font-medium text-slate-500">
                        Clicca su 'Attiva Microfono' per cantare
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* MUSICAL STAFF HIGHWAY - Authentic Staff with Scrolling Notes */}
            <div className="w-full h-60 bg-[#FDFBF7] rounded-3xl border-2 border-amber-200 shadow-playful-sm relative overflow-hidden px-4 mb-5 select-none">
              {isMelodic ? (
                <>
                  {/* Pentagram 5 Staff Lines: [48, 72, 96, 120, 144] */}
                  {STAFF_LINES.map((yLine, idx) => (
                    <div
                      key={idx}
                      className="absolute left-0 right-0 h-[2px] bg-slate-400/80 pointer-events-none"
                      style={{ top: `${yLine}px` }}
                    />
                  ))}

                  {/* Treble Clef (Chiave di Violino / Sol) */}
                  <span
                    className="absolute left-3 top-2 text-7xl text-slate-700/80 font-serif leading-none select-none pointer-events-none"
                    style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.05))' }}
                  >
                    𝄞
                  </span>

                  {/* Vertical bar line dividing clef */}
                  <div className="absolute left-[58px] top-[48px] bottom-[96px] w-[1px] bg-slate-300 pointer-events-none" />
                </>
              ) : (
                /* Rhythmic Body Percussion Tracks */
                <>
                  {[
                    { id: 'snap', name: 'Dita', icon: '🫰', y: 32 },
                    { id: 'clap', name: 'Mani', icon: '👏', y: 68 },
                    { id: 'chest', name: 'Petto', icon: '🫀', y: 104 },
                    { id: 'thighs', name: 'Cosce', icon: '🦵', y: 140 },
                    { id: 'feet', name: 'Piedi', icon: '🦶', y: 176 },
                  ].map((track) => (
                    <React.Fragment key={track.id}>
                      <div
                        className="absolute left-0 right-0 h-[1px] bg-amber-200/60 pointer-events-none"
                        style={{ top: `${track.y}px` }}
                      />
                      <div
                        className="absolute left-2 z-10 flex items-center gap-1 bg-white/90 px-1.5 py-0.5 rounded-lg border border-amber-200 shadow-2xs pointer-events-none"
                        style={{ top: `${track.y - 12}px` }}
                      >
                        <span className="text-xs">{track.icon}</span>
                        <span className="text-[9px] font-black text-slate-700 uppercase tracking-tighter hidden sm:inline">
                          {track.name}
                        </span>
                      </div>
                    </React.Fragment>
                  ))}
                </>
              )}

              {/* Target Hit Zone Line & Receptor at left: 80px */}
              <div className="absolute left-[80px] top-2 bottom-2 w-1 bg-emerald-500/85 rounded-full z-15 shadow-sm pointer-events-none flex flex-col items-center">
                <div className="w-5 h-5 -mt-2 bg-emerald-500 rounded-full flex items-center justify-center text-white text-[9px] font-black shadow-xs">
                  🎯
                </div>
              </div>
              <div className="absolute left-[68px] top-2 bottom-2 w-7 bg-emerald-400/10 border-x border-emerald-400/30 pointer-events-none z-5" />

              {/* Live Singing Follower Cursor on Staff */}
              {isMelodic && inputMode === 'singing' && micActive && livePitch && livePitch.isConfident && (
                <div
                  className="absolute z-25 transition-all duration-75 flex items-center pointer-events-none"
                  style={{
                    left: '62px',
                    top: `${(PITCH_STAFF_Y[livePitch.solfegeKey] ?? 120) - 14}px`,
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white text-[10px] font-black animate-pulse"
                    style={{ backgroundColor: livePitch.color || '#8B5CF6' }}
                  >
                    🎤
                  </div>
                  <span className="ml-1 text-[10px] font-black bg-white/95 text-slate-800 px-1.5 py-0.5 rounded-md shadow border border-slate-200">
                    {livePitch.solfegeLabel}
                  </span>
                </div>
              )}

              {/* Scrolling Notes on the Staff */}
              {evaluator?.expectedBeats.map((beat) => {
                const targetOffset = 80; // px where target zone is
                const distancePx = ((beat.timeMs - (countInBeats * msPerBeat) - currentTimeMs) / (msPerBeat / 4)) * 48;
                const leftPos = targetOffset + distancePx;

                if (leftPos < -60 || leftPos > 760) return null;

                if (isMelodic) {
                  const pitchKey = (beat.pitch || 'SOL').toUpperCase();
                  const topY = PITCH_STAFF_Y[pitchKey] ?? 120;
                  const solfegeMeta = SOLFEGE_MAP[pitchKey] || { label: beat.pitch, color: '#38BDF8' };
                  const isMiddleC = pitchKey === 'DO' || pitchKey === 'C4';
                  const isAboveMiddle = topY < 96; // Notes above middle line Si4 have stem down

                  return (
                    <div
                      key={beat.id}
                      className="absolute z-10 transition-transform pointer-events-none"
                      style={{
                        left: `${leftPos - 16}px`,
                        top: `${topY - 14}px`,
                      }}
                    >
                      {/* Kodály hand sign badge to the left of each notehead */}
                      <div className="absolute -left-7 top-1/2 -translate-y-1/2 z-20">
                        <KodalyHandSign pitch={pitchKey} size="sm" />
                      </div>

                      {/* Ledger line for Middle Do (C4) */}
                      {isMiddleC && (
                        <div className="absolute -left-2 -right-2 top-1/2 -translate-y-1/2 h-[2px] bg-slate-800 pointer-events-none z-0" />
                      )}

                      {/* Notehead */}
                      <div
                        className={`w-8 h-7 rounded-[50%] border-2 border-slate-900 shadow-md flex items-center justify-center font-black relative z-10 ${
                          beat.rating === 'perfect'
                            ? 'ring-2 ring-emerald-400 bg-emerald-400 text-white'
                            : beat.rating === 'good'
                            ? 'ring-2 ring-amber-400 bg-amber-400 text-amber-950'
                            : beat.rating === 'wrong_pitch'
                            ? 'ring-2 ring-purple-400 bg-purple-400 text-purple-950'
                            : beat.rating === 'missed'
                            ? 'bg-rose-200 text-rose-600 opacity-60'
                            : 'text-white'
                        }`}
                        style={{
                          backgroundColor: !beat.rating ? (solfegeMeta.color || '#38BDF8') : undefined,
                        }}
                      >
                        <span className="text-[10px] leading-none drop-shadow-xs">
                          {solfegeMeta.label || beat.pitch}
                        </span>

                        {/* Rating Badge */}
                        {beat.rating && (
                          <span className="absolute -top-3.5 -right-2 text-xs">
                            {beat.rating === 'perfect' && '⭐'}
                            {beat.rating === 'good' && '👍'}
                            {beat.rating === 'wrong_pitch' && '⚠️'}
                            {beat.rating === 'missed' && '❌'}
                          </span>
                        )}
                      </div>

                      {/* Note Stem */}
                      {isAboveMiddle ? (
                        <div className="absolute left-0 top-3.5 w-[2.5px] h-8 bg-slate-900 rounded-full z-0" />
                      ) : (
                        <div className="absolute right-0 bottom-3.5 w-[2.5px] h-8 bg-slate-900 rounded-full z-0" />
                      )}
                    </div>
                  );
                } else {
                  // Rhythmic Beat
                  const topY = RHYTHM_TRACK_Y[beat.sound || 'clap'] || 68;
                  return (
                    <div
                      key={beat.id}
                      className={`absolute z-10 w-9 h-9 rounded-2xl flex items-center justify-center text-sm font-black transition-all shadow-md border-2 ${
                        beat.rating === 'perfect'
                          ? 'bg-emerald-400 text-white border-emerald-600 ring-2 ring-emerald-300'
                          : beat.rating === 'good'
                          ? 'bg-amber-400 text-amber-950 border-amber-600 ring-2 ring-amber-300'
                          : beat.rating === 'missed'
                          ? 'bg-rose-200 text-rose-600 border-rose-300 opacity-60'
                          : 'bg-amber-400 text-amber-950 border-slate-800'
                      }`}
                      style={{
                        left: `${leftPos - 18}px`,
                        top: `${topY - 18}px`,
                      }}
                    >
                      <span className="text-lg">
                        {beat.sound === 'clap' ? '👏' : beat.sound === 'feet' ? '🦶' : beat.sound === 'thighs' ? '🦵' : beat.sound === 'chest' ? '🫀' : beat.sound === 'snap' ? '🫰' : '🎵'}
                      </span>
                      {beat.rating && (
                        <span className="absolute -top-2 -right-2 text-[10px]">
                          {beat.rating === 'perfect' && '⭐'}
                          {beat.rating === 'good' && '👍'}
                          {beat.rating === 'missed' && '❌'}
                        </span>
                      )}
                    </div>
                  );
                }
              })}
            </div>

            {/* INTERACTIVE INPUT STAGE: Melodic Touch Keyboard vs Rhythmic Tap */}
            {isMelodic ? (
              <div className="w-full">
                <div className="text-xs font-black text-amber-900 uppercase tracking-wider mb-2 text-center flex items-center justify-center gap-2">
                  {inputMode === 'singing' ? (
                    <span>🎤 Canta al microfono o tocca le barre musicali per ascoltare la nota guida:</span>
                  ) : (
                    <span>🎹 Suona le note: Touch su schermo, tasti PC [A-K] o tastiera MIDI</span>
                  )}
                </div>

                {/* Touch Piano / Orff Chime Bars */}
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2.5 w-full">
                  {activePitchKeys.map((pKey) => {
                    const data = KODALY_SIGNS_DATA[pKey] || KODALY_SIGNS_DATA.SOL;
                    const isPressed = activePressedPitch === pKey;

                    return (
                      <button
                        key={pKey}
                        onMouseDown={() => handlePitchTap(pKey)}
                        onTouchStart={(e) => {
                          e.preventDefault();
                          handlePitchTap(pKey);
                        }}
                        className={`btn-playful py-4 px-2 rounded-2xl flex flex-col items-center justify-between transition-all transform select-none cursor-pointer border-2 ${
                          isPressed ? 'scale-95 ring-4 ring-amber-400 brightness-110' : 'hover:scale-[1.03]'
                        }`}
                        style={{
                          backgroundColor: data.color,
                          borderColor: '#1E293B',
                          color: data.textColor,
                          height: '110px',
                        }}
                      >
                        {/* Note Name & Keyboard Key Badge */}
                        <div className="flex items-center justify-between w-full px-1">
                          <span className="text-base font-black drop-shadow-sm">
                            {data.syllable}
                          </span>
                          <span className="text-[10px] font-black bg-white/90 text-slate-800 px-1 rounded shadow-xs">
                            {data.keyboardKey}
                          </span>
                        </div>

                        {/* Vector Kodaly Hand Sign */}
                        <div className="my-auto drop-shadow-xs">
                          <KodalyHandSign pitch={pKey} size="md" />
                        </div>

                        {/* Scientific Pitch / Description */}
                        <span className="text-[9px] font-bold opacity-90 truncate max-w-full">
                          {data.name.split(' ')[0]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Rhythmic Big Button + Body Percussion row */
              <div className="w-full flex flex-col items-center gap-4">
                <div className="flex flex-wrap items-center justify-center gap-2 w-full max-w-xl">
                  {[
                    { id: 'feet', icon: '🦶', label: 'Piedi', key: 'Z' },
                    { id: 'thighs', icon: '🦵', label: 'Cosce', key: 'X' },
                    { id: 'chest', icon: '🫀', label: 'Petto', key: 'C' },
                    { id: 'clap', icon: '👏', label: 'Mani', key: 'V' },
                    { id: 'snap', icon: '🫰', label: 'Dita', key: 'B' },
                    { id: 'claves', icon: '🥢', label: 'Legnetti', key: 'N' },
                    { id: 'tambourine', icon: '🪘', label: 'Tamburello', key: 'M' },
                    { id: 'triangle', icon: '📐', label: 'Triangolo', key: ',' },
                    { id: 'cymbals', icon: '🪙', label: 'Piatti', key: '.' },
                  ]
                    .filter(item => settingsManager.isInstrumentEnabled(item.id))
                    .map(item => (
                      <button
                        key={item.id}
                        onClick={() => handlePitchTap(item.id)}
                        className={`btn-playful min-w-[72px] p-2 bg-white border-2 border-amber-200 rounded-2xl flex flex-col items-center justify-center hover:bg-amber-50 ${
                          activePressedPitch === item.id ? 'ring-4 ring-amber-400 bg-amber-100' : ''
                        }`}
                      >
                        <span className="text-2xl">{item.icon}</span>
                        <span className="text-xs font-black text-slate-800">{item.label}</span>
                        <kbd className="text-[9px] bg-slate-100 px-1 rounded text-slate-500 font-bold mt-0.5">
                          [{item.key}]
                        </kbd>
                      </button>
                    ))}
                </div>

                {/* Giant Spacebar Tap Button */}
                <button
                  onMouseDown={handleUniversalTap}
                  className="btn-playful w-72 h-20 bg-gradient-to-b from-emerald-400 to-emerald-600 active:from-emerald-600 active:to-emerald-700 text-white rounded-3xl shadow-playful flex flex-col items-center justify-center text-lg font-black gap-0.5 cursor-pointer select-none"
                >
                  <span>BATTI IL TEMPO!</span>
                  <span className="text-[11px] font-semibold opacity-90">
                    (Barra Spaziatrice o Clic)
                  </span>
                </button>
              </div>
            )}
          </div>
        )}

        {gameState === 'finished' && result && (
          <div className="text-center max-w-lg p-6 bg-white rounded-3xl shadow-playful border border-amber-200 animate-fade-in my-auto">
            {/* Stars */}
            <div className="flex items-center justify-center gap-3 mb-2">
              {[1, 2, 3].map((starIdx) => (
                <div
                  key={starIdx}
                  className={`transition-all duration-300 transform ${
                    starIdx <= result.stars
                      ? 'text-amber-400 scale-125 drop-shadow-md'
                      : 'text-slate-200 scale-90'
                  }`}
                >
                  <Star className="w-12 h-12 fill-current" />
                </div>
              ))}
            </div>

            <h3 className="text-2xl font-black text-slate-800 mb-1">
              {result.stars >= 2 ? 'Super Performance!' : 'Buon Tentativo!'}
            </h3>
            <p className="text-sm font-bold text-amber-800 mb-5">{result.verdict}</p>

            {/* Score Stats Grid */}
            <div className="grid grid-cols-3 gap-3 p-3.5 bg-amber-50/70 rounded-2xl border border-amber-200 mb-5">
              <div className="flex flex-col items-center">
                <span className="text-xs font-bold text-slate-500">Accuratezza</span>
                <span className="text-2xl font-black text-emerald-700">{result.accuracy}%</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-xs font-bold text-slate-500">Perfetti</span>
                <span className="text-2xl font-black text-emerald-600">{result.perfectCount}</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-xs font-bold text-slate-500">A Tempo</span>
                <span className="text-2xl font-black text-amber-600">{result.goodCount}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={startSession}
                className="btn-playful flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Riprova</span>
              </button>

              {(onNextLevel || onComplete) && (
                <button
                  onClick={() => {
                    if (onComplete) {
                      onComplete({ levelId: level.id, stars: result.stars, accuracy: result.accuracy });
                    } else if (onNextLevel) {
                      onNextLevel();
                    }
                  }}
                  className="btn-playful flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black flex items-center justify-center gap-2 shadow-emerald-200"
                >
                  <span>Prossimo Livello</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
