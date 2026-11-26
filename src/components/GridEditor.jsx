import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Play,
  Square,
  Volume2,
  Trash2,
  Layers,
  Music,
  RotateCcw,
  Sparkles,
  Clock,
  CheckCircle2,
  AlertCircle,
  Headphones,
  Eye,
  Sliders,
  FolderOpen,
  Save,
  Activity,
  Repeat,
  ArrowRight
} from 'lucide-react';
import NoteRenderer, { SOUND_COLORS } from './NoteRenderer';
import StaffRenderer, {
  BIGRAM_ROWS,
  TRIGRAM_ROWS,
  PENTAGRAM_ROWS,
  PERCUSSION_ROWS,
  ORFF_ROWS,
  ALL_RHYTHMIC_ROWS,
} from './StaffRenderer';
import PieCycleChart from './PieCycleChart';
import DidacticExplanationCard from './DidacticExplanationCard';
import { audioEngine, SOLFEGE_MAP } from '../engine/AudioEngine';
import { FIGURE_DURATIONS, FIGURE_INFO } from '../data/curriculum';
import { settingsManager } from '../engine/SettingsManager';
import ProjectManagerModal from './ProjectManagerModal';
import { ScoreStaff, ScoreNotes } from './ScoreEngraving';
import { getMeter } from '../engine/Transport';

const SECOND_VOICE = PENTAGRAM_ROWS.map(row => ({ ...row, id: `v2:${row.id}`, voice: 2 }));
const DUAL_ROWS = [...PENTAGRAM_ROWS, ...SECOND_VOICE];

export default function GridEditor({
  initialNotes = [],
  levelConfig = null,
  onNotesChange = null,
  isReadOnly = false,
  onEvaluateMath = null,
  onNextLevel = null,
}) {
  const isSandbox = levelConfig?.id === 'SANDBOX' || levelConfig?.isSandbox;
  useEffect(() => () => audioEngine.stopPlayback(), []);

  // View mode: 'blocks' (Proportional) or 'conventional' (Standard notation)
  const [viewMode, setViewMode] = useState(levelConfig?.section === 'melody' ? 'conventional' : 'blocks');
  const [cursor, setCursor] = useState({ step: 0, row: 0 });
  const [undo, setUndo] = useState([]);
  const [redo, setRedo] = useState([]);
  const [dotted, setDotted] = useState(false);
  const [editMessage, setEditMessage] = useState('');

  // Sandbox-specific configuration: 'rhythm' (Tablatura Ritmica) | 'melody' (Notazione Melodica)
  const [sandboxMode, setSandboxMode] = useState('rhythm');
  const [sandboxStaff, setSandboxStaff] = useState('pentagram'); // 'pentagram' | 'trigram' | 'bigram' | 'dual'
  const [sandboxBars, setSandboxBars] = useState(2); // 1, 2, 4, 8

  // Active notes state: array of { id, step, duration, rowId, pitch, sound, accidental, isRest }
  const [notes, setNotes] = useState(initialNotes || []);
  const [selectedNoteId, setSelectedNoteId] = useState(null);

  // Selected tool from palette
  const [selectedFigure, setSelectedFigure] = useState('quarter');
  const [selectedAccidental, setSelectedAccidental] = useState(0); // 0 (natural), 1 (#), -1 (b)

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPlayingTarget, setIsPlayingTarget] = useState(false);
  const [isSolutionVisibleOnGrid, setIsSolutionVisibleOnGrid] = useState(false);
  const [isLooping, setIsLooping] = useState(() => settingsManager.get('continuousLoop') || false);

  const [currentStep, setCurrentStep] = useState(0);
  const [playheadPosPx, setPlayheadPosPx] = useState(0);
  const [currentBeat, setCurrentBeat] = useState(1);
  const [beatProgress, setBeatProgress] = useState(0);
  const [bpm, setBpm] = useState(levelConfig?.bpm || 85);
  const [metronomeEnabled, setMetronomeEnabled] = useState(true);
  const [melodicInstrument, setMelodicInstrument] = useState('xylophone');
  const [showChironomy, setShowChironomy] = useState(() => settingsManager.get('showKodalySigns') !== false);
  const [forcePentagramStaff, setForcePentagramStaff] = useState(() => settingsManager.get('forceTrebleClef') || false);

  // Sync with global settings
  useEffect(() => {
    const unsub = settingsManager.subscribe((newSettings) => {
      if (newSettings.forceTrebleClef !== undefined) {
        setForcePentagramStaff(newSettings.forceTrebleClef);
      }
      if (newSettings.showKodalySigns !== undefined) {
        setShowChironomy(newSettings.showKodalySigns);
      }
      if (newSettings.continuousLoop !== undefined) {
        setIsLooping(newSettings.continuousLoop);
      }
    });
    return unsub;
  }, []);

  const [showProjectModal, setShowProjectModal] = useState(false);
  const [timeSignature, setTimeSignature] = useState(levelConfig?.timeSignature || '4/4');

  // Dragging state for 2D repositioning
  const [draggedNote, setDraggedNote] = useState(null);
  const [ghostSnap, setGhostSnap] = useState(null); // { step, rowId }

  const gridContainerRef = useRef(null);
  const staffAreaRef = useRef(null);
  const rowLabelsRef = useRef(null);

  // Dimensions
  const stepWidth = 32; // px per 16th note
  const rowHeight = viewMode === 'conventional' ? 16 : 44;

  // Sixteenths per measure based on active Time Signature
  const { barSteps: sixteenthsPerBar } = getMeter(timeSignature);

  // Determine total steps and bars
  const totalBars = isSandbox
    ? sandboxBars
    : Math.ceil((levelConfig?.totalSteps || (notes.length > 0 ? Math.max(sixteenthsPerBar, ...notes.map(n => n.step + (n.duration || 4))) : sixteenthsPerBar)) / sixteenthsPerBar);
  const totalSteps = totalBars * sixteenthsPerBar;

  // Determine staff type & active rows
  const isMelodic = isSandbox
    ? sandboxMode === 'melody'
    : levelConfig?.section === 'melody' || levelConfig?.staffType !== 'single';

  const staffType = isSandbox
    ? (sandboxMode === 'rhythm' ? 'single' : sandboxStaff)
    : (isMelodic && forcePentagramStaff ? 'pentagram' : (levelConfig?.staffType || 'single'));

  // Left gutter reserved for clef + time signature, so notes/bar lines
  // start AFTER them in conventional notation instead of overlapping.
  const showClef = staffType === 'pentagram' || staffType === 'dual';
  const staffIndent = showClef ? 86 : viewMode === 'conventional' ? 18 : 0;

  const activeRows = React.useMemo(() => {
    if (isSandbox) {
      if (sandboxMode === 'rhythm') {
        // Tablatura Ritmica: all 9 Body Percussion + Orff instruments
        return ALL_RHYTHMIC_ROWS;
      } else {
        if (sandboxStaff === 'bigram') return BIGRAM_ROWS;
        if (sandboxStaff === 'trigram') return TRIGRAM_ROWS;
        return sandboxStaff === 'dual' ? DUAL_ROWS : PENTAGRAM_ROWS;
      }
    }

    // Melodic Curriculum with forced Pentagram mode
    if (isMelodic && forcePentagramStaff) {
      return PENTAGRAM_ROWS;
    }

    // Curriculum mode standard
    if (staffType === 'bigram') return BIGRAM_ROWS;
    if (staffType === 'trigram') return TRIGRAM_ROWS;
    if (staffType === 'dual') return DUAL_ROWS;
    if (staffType === 'pentagram') return PENTAGRAM_ROWS;

    // Rhythmic / Percussion in curriculum
    if (levelConfig?.allowedSounds && levelConfig.allowedSounds.length > 0) {
      const allowed = levelConfig.allowedSounds;
      const combined = ALL_RHYTHMIC_ROWS;
      const filtered = combined.filter(r => allowed.includes(r.id) && settingsManager.isInstrumentEnabled(r.id));
      return filtered.length > 0 ? filtered : combined.filter(r => allowed.includes(r.id));
    }
    const filteredPerc = PERCUSSION_ROWS.filter(r => settingsManager.isInstrumentEnabled(r.id));
    return filteredPerc.length > 0 ? filteredPerc : PERCUSSION_ROWS;
  }, [isSandbox, sandboxMode, sandboxStaff, staffType, isMelodic, forcePentagramStaff, levelConfig]);

  // Sync initial notes if prop changes
  useEffect(() => {
    if (initialNotes) {
      setNotes(initialNotes);
      setIsSolutionVisibleOnGrid(false);
    }
  }, [initialNotes, levelConfig?.id]);

  // Sync BPM if level changes
  useEffect(() => {
    if (levelConfig?.bpm) {
      setBpm(levelConfig.bpm);
      audioEngine.setBpm(levelConfig.bpm);
    }
  }, [levelConfig]);

  useEffect(() => {
    setUndo([]);
    setRedo([]);
    setSelectedNoteId(null);
    setTimeSignature(levelConfig?.timeSignature || '4/4');
  }, [levelConfig?.id]);

  useEffect(() => {
    if (!isSandbox && levelConfig?.allowedFigures?.length && !levelConfig.allowedFigures.includes(selectedFigure)) {
      setSelectedFigure(levelConfig.allowedFigures[0]);
    }
  }, [isSandbox, levelConfig, selectedFigure]);

  // Notify parent on notes change
  const updateNotes = (newNotes, remember = true) => {
    if (remember) {
      setUndo(history => [...history.slice(-49), notes]);
      setRedo([]);
    }
    setNotes(newNotes);
    if (onNotesChange) onNotesChange(newNotes);
  };

  const goBack = () => {
    if (!undo.length || isReadOnly) return;
    setRedo(stack => [...stack, notes]);
    updateNotes(undo.at(-1), false);
    setUndo(undo.slice(0, -1));
  };
  const goForward = () => {
    if (!redo.length || isReadOnly) return;
    setUndo(stack => [...stack, notes]);
    updateNotes(redo.at(-1), false);
    setRedo(redo.slice(0, -1));
  };

  // -------------------------------------------------------------
  // PLAYBACK LOGIC (User Score vs Target Solution)
  // -------------------------------------------------------------

  const handleTogglePlay = () => {
    if (isPlaying || isPlayingTarget) {
      handleStop();
    } else {
      audioEngine.setBpm(bpm);
      audioEngine.setMelodicInstrument(melodicInstrument);

      const score = {
        bpm,
        totalSteps,
        timeSignature,
        playMetronome: metronomeEnabled,
        loop: isLooping,
        tracks: [
          {
            defaultSound: 'clap',
            notes: notes.map(n => {
              const row = activeRows.find(r => r.id === n.rowId);
              return {
                step: n.step,
                duration: n.duration || 4,
                isRest: !!n.isRest,
                pitch: n.pitch || row?.pitch,
                sound: n.sound || row?.sound || 'clap',
                accidental: n.accidental || 0,
              };
            })
          }
        ]
      };

      setIsPlaying(true);
      setIsPlayingTarget(false);

      audioEngine.startScorePlayback(
        score,
        (progress) => {
          setCurrentStep(progress.step);
          setPlayheadPosPx(progress.position * stepWidth);
          setCurrentBeat(progress.measureBeat);
          setBeatProgress(progress.beatProgress);
        },
        () => {
          setIsPlaying(false);
          setCurrentStep(0);
          setPlayheadPosPx(0);
          setCurrentBeat(1);
        }
      );
    }
  };

  const handlePlayTarget = () => {
    if (!levelConfig?.targetNotes) return;
    if (isPlaying) handleStop();

    setIsPlayingTarget(true);
    setIsPlaying(false);
    audioEngine.setBpm(levelConfig.bpm || bpm);
    audioEngine.setMelodicInstrument(melodicInstrument);

    const score = {
      bpm: levelConfig.bpm || bpm,
      totalSteps: levelConfig.totalSteps || totalSteps,
      timeSignature: levelConfig.timeSignature || timeSignature,
      playMetronome: true,
      loop: isLooping,
      tracks: [
        {
          notes: levelConfig.targetNotes || [],
        },
        ...(levelConfig.targetNotesTrack2
          ? [{ notes: levelConfig.targetNotesTrack2 }]
          : [])
      ]
    };

    audioEngine.startScorePlayback(
      score,
      (progress) => {
        setCurrentStep(progress.step);
          setPlayheadPosPx(progress.position * stepWidth);
        setCurrentBeat(progress.measureBeat);
        setBeatProgress(progress.beatProgress);
      },
      () => {
        setIsPlayingTarget(false);
        setCurrentStep(0);
        setPlayheadPosPx(0);
        setCurrentBeat(1);
      }
    );
  };

  const handleStop = () => {
    audioEngine.stopPlayback();
    setIsPlaying(false);
    setIsPlayingTarget(false);
    setCurrentStep(0);
    setPlayheadPosPx(0);
    setCurrentBeat(1);
  };

  const handleShowSolutionOnGrid = () => {
    if (!levelConfig?.targetNotes) return;
    if (isSolutionVisibleOnGrid) {
      // Revert to initial or clear
      updateNotes(levelConfig.initialScore || []);
      setIsSolutionVisibleOnGrid(false);
    } else {
      // Load target solution on grid
      updateNotes([
        ...levelConfig.targetNotes,
        ...(staffType === 'dual' ? (levelConfig.targetNotesTrack2 || []).map(note => ({
          ...note, id: `v2:${note.id}`, rowId: `v2:${note.rowId}`,
        })) : []),
      ]);
      setIsSolutionVisibleOnGrid(true);
    }
  };

  // -------------------------------------------------------------
  // 2D SNAP & DRAG / DROP SYSTEM
  // -------------------------------------------------------------

  const calculateSnap = (clientX, clientY) => {
    // Reference staffAreaRef directly so coordinates match the staff rows with zero vertical offset
    const targetEl = staffAreaRef.current || gridContainerRef.current;
    if (!targetEl) return null;
    const rect = targetEl.getBoundingClientRect();

    const relX = clientX - rect.left - staffIndent;
    const relY = clientY - rect.top;

    if (relX < 0 || relY < 0 || relX >= totalSteps * stepWidth || relY >= activeRows.length * rowHeight) return null;

    // Snap to 1/16th note on X
    const rawStep = Math.floor(relX / stepWidth);
    const step = Math.max(0, Math.min(totalSteps - 1, rawStep));

    // Snap to row on Y
    const rawRowIdx = Math.floor(relY / rowHeight);
    const rowIdx = Math.max(0, Math.min(activeRows.length - 1, rawRowIdx));
    const targetRow = activeRows[rowIdx];
    if (!targetRow) return null;

    return {
      step,
      rowIdx,
      rowId: targetRow.id,
      pitch: targetRow.pitch || null,
      sound: targetRow.sound || null,
    };
  };

  const handleGridClick = (e) => {
    if (isReadOnly) return;
    const snap = calculateSnap(e.clientX, e.clientY);
    if (!snap) return;
    staffAreaRef.current?.focus({ preventScroll: true });
    setCursor({ step: snap.step, row: snap.rowIdx });
    insertAt(snap);
  };

  const toolDuration = (figure = selectedFigure) =>
    (FIGURE_DURATIONS[figure] || 4) * (dotted && isSandbox && !figure.includes('sixteenth') ? 1.5 : 1);

  const insertAt = (snap) => {
    if (isReadOnly || !snap) return;
    // Check if clicked directly on an existing note
    const existing = notes.find(n => n.step === snap.step && n.rowId === snap.rowId);
    if (existing) {
      setSelectedNoteId(existing.id);
      return;
    }

    // Add note at clicked position
    const duration = toolDuration();
    const isRest = selectedFigure.startsWith('rest_');
    if (snap.step + duration > totalSteps) {
      setEditMessage('La figura supera la fine della partitura. Aggiungi una battuta o scegli una durata più breve.');
      return;
    }
    setEditMessage('');

    const newNote = {
      id: `note_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      step: snap.step,
      duration,
      rowId: snap.rowId,
      pitch: snap.pitch,
      sound: snap.sound,
      accidental: selectedAccidental,
      isRest,
    };

    // Audition sound
    if (!isRest) {
      if (snap.pitch) {
        audioEngine.playNote(snap.pitch, (duration / 4) * (60 / bpm), 0, selectedAccidental);
      } else if (snap.sound) {
        audioEngine.playSoundByName(snap.sound);
      }
    }

    updateNotes([...notes, newNote]);
    setSelectedNoteId(newNote.id);
  };

  const handleStartDragExisting = (note, e) => {
    if (isReadOnly || e.button !== 0) return;
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    setDraggedNote(note);
    setSelectedNoteId(note.id);
  };

  const handleMouseMove = (e) => {
    if (!draggedNote) return;
    const snap = calculateSnap(e.clientX, e.clientY);
    setGhostSnap(snap);
  };

  const handleMouseUp = () => {
    if (draggedNote && ghostSnap && canMove(draggedNote, ghostSnap) &&
      (draggedNote.step !== ghostSnap.step || draggedNote.rowId !== ghostSnap.rowId)) {
      const updated = notes.map(n => {
        if (n.id === draggedNote.id) {
          return {
            ...n,
            step: ghostSnap.step,
            rowId: ghostSnap.rowId,
            pitch: ghostSnap.pitch,
            sound: ghostSnap.sound,
          };
        }
        return n;
      });

      // Audition new position
      if (!draggedNote.isRest) {
        if (ghostSnap.pitch) {
          audioEngine.playNote(ghostSnap.pitch, 0.4, 0, draggedNote.accidental || 0);
        } else if (ghostSnap.sound) {
          audioEngine.playSoundByName(ghostSnap.sound);
        }
      }

      updateNotes(updated);
    }

    setDraggedNote(null);
    setGhostSnap(null);
  };

  const handleDeleteSelected = () => {
    if (!selectedNoteId || isReadOnly) return;
    updateNotes(notes.filter(n => n.id !== selectedNoteId));
    setSelectedNoteId(null);
  };

  const handleClearAll = () => {
    if (isReadOnly) return;
    updateNotes([]);
    setSelectedNoteId(null);
  };

  const canMove = (note, spot) => spot.step + (note.duration || 4) <= totalSteps &&
    !notes.some(other => other.id !== note.id && other.step === spot.step && other.rowId === spot.rowId);

  const handleScoreKeys = (e) => {
    if (isReadOnly || e.altKey) return;
    const row = Math.min(cursor.row, activeRows.length - 1);
    const step = Math.min(cursor.step, totalSteps - 1);
    const note = notes.find(item => item.id === selectedNoteId);
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      if (e.shiftKey) goForward(); else goBack();
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      handleDeleteSelected();
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const target = activeRows[row];
      if (target) insertAt({ step, rowId: target.id, pitch: target.pitch || null, sound: target.sound || null });
    } else if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
      e.preventDefault();
      const moveNote = e.shiftKey && note;
      const baseRow = moveNote ? activeRows.findIndex(r => r.id === note.rowId) : row;
      const baseStep = moveNote ? note.step : step;
      const nextRow = Math.max(0, Math.min(activeRows.length - 1, baseRow + (e.key === 'ArrowDown' ? 1 : e.key === 'ArrowUp' ? -1 : 0)));
      const nextStep = Math.max(0, Math.min(totalSteps - 1, baseStep + (e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0)));
      const target = activeRows[nextRow];
      if (!target) return;
      if (moveNote) {
        const spot = { step: nextStep, rowId: target.id, pitch: target.pitch || null, sound: target.sound || null };
        if (!canMove(note, spot)) return;
        updateNotes(notes.map(item => item.id === note.id ? { ...item, ...spot } : item));
      } else setSelectedNoteId(notes.find(item => item.step === nextStep && item.rowId === target.id)?.id ?? null);
      setCursor({ row: nextRow, step: nextStep });
      const scroller = gridContainerRef.current;
      if (scroller) {
        const x = staffIndent + nextStep * stepWidth;
        if (x < scroller.scrollLeft) scroller.scrollLeft = x;
        else if (x + stepWidth > scroller.scrollLeft + scroller.clientWidth) scroller.scrollLeft = x + stepWidth - scroller.clientWidth;
        const y = nextRow * rowHeight;
        if (y < scroller.scrollTop) scroller.scrollTop = y;
        else if (y + rowHeight + 32 > scroller.scrollTop + scroller.clientHeight) {
          scroller.scrollTop = y + rowHeight + 32 - scroller.clientHeight;
        }
      }
    }
  };

  const changeFigure = (figure, dot = dotted) => {
    setSelectedFigure(figure);
    const note = notes.find(item => item.id === selectedNoteId);
    if (!note || isReadOnly) return;
    const duration = (FIGURE_DURATIONS[figure] || 4) * (dot && isSandbox && !figure.includes('sixteenth') ? 1.5 : 1);
    if (note.step + duration > totalSteps) {
      setEditMessage('La durata scelta supera la fine della partitura.');
      return;
    }
    setEditMessage('');
    updateNotes(notes.map(item => item.id === note.id ? { ...item, duration, isRest: figure.startsWith('rest_') } : item));
  };
  const changeAccidental = (value) => {
    setSelectedAccidental(value);
    if (!isReadOnly && notes.some(note => note.id === selectedNoteId && note.pitch && !note.isRest)) {
      updateNotes(notes.map(note => note.id === selectedNoteId ? { ...note, accidental: value } : note));
    }
  };

  // Collapsible interface sections to maximize workspace
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [showPalette, setShowPalette] = useState(true);
  const [showDidacticCard, setShowDidacticCard] = useState(true);

  // -------------------------------------------------------------
  // MATHEMATICAL BAR SUM CALCULATION (4/4 Fraction Verification)
  // Smart multi-track & chord aware calculation
  // -------------------------------------------------------------
  const calculateBarFractions = () => {
    const bars = [];
    for (let b = 0; b < totalBars; b++) {
      const barStart = b * sixteenthsPerBar;
      const barEnd = (b + 1) * sixteenthsPerBar;

      // Notes active in this bar
      const barNotes = notes.filter(n => {
        const dur = n.duration || 4;
        const noteEnd = n.step + dur;
        return n.step < barEnd && noteEnd > barStart;
      });

      // Group notes by row/voice to measure per-voice metric occupancy
      const rowDurations = {};
      let anyRowOverflows = false;
      let maxOverflowExtra = 0;
      const coveredSteps = new Set();

      barNotes.forEach(n => {
        const dur = n.duration || 4;
        const noteEnd = n.step + dur;
        const rowKey = n.rowId || n.sound || n.pitch || 'default';

        if (noteEnd > barEnd) {
          const extra = noteEnd - barEnd;
          if (extra > maxOverflowExtra) maxOverflowExtra = extra;
        }

        const activeStartInBar = Math.max(n.step, barStart);
        const activeEndInBar = Math.min(noteEnd, barEnd);
        const durationInThisBar = Math.max(0, activeEndInBar - activeStartInBar);

        rowDurations[rowKey] = (rowDurations[rowKey] || 0) + durationInThisBar;

        for (let s = activeStartInBar; s < activeEndInBar; s++) {
          coveredSteps.add(s);
        }
      });

      const rowDurList = Object.values(rowDurations);
      const maxRowDuration = rowDurList.length > 0 ? Math.max(...rowDurList) : 0;

      rowDurList.forEach(dur => {
        if (dur > sixteenthsPerBar) {
          anyRowOverflows = true;
          const extra = dur - sixteenthsPerBar;
          if (extra > maxOverflowExtra) maxOverflowExtra = extra;
        }
      });

      // Simultaneous voices/instruments share the same time slice without double counting
      let effectiveSixteenths = Math.max(coveredSteps.size, maxRowDuration);
      if (maxOverflowExtra > 0) {
        effectiveSixteenths += maxOverflowExtra;
      }

      const isOverflow = anyRowOverflows || maxOverflowExtra > 0 || (rowDurList.length <= 1 && maxRowDuration > sixteenthsPerBar);
      const isComplete = !isOverflow && (coveredSteps.size === sixteenthsPerBar || maxRowDuration === sixteenthsPerBar);

      bars.push({
        barNumber: b + 1,
        totalSixteenths: effectiveSixteenths,
        quarters: effectiveSixteenths / 4.0,
        isComplete,
        isOverflow,
      });
    }
    return bars;
  };

  const barFractions = calculateBarFractions();

  return (
    <div
      className="studio-panel score-editor flex flex-col h-full overflow-hidden select-none"
      onPointerMove={handleMouseMove}
      onPointerUp={handleMouseUp}
      onPointerCancel={() => { setDraggedNote(null); setGhostSnap(null); }}
    >
      {/* ----------------- DIDACTIC EXPLANATION CARD (For Curriculum levels) ----------------- */}
      {showDidacticCard && !isSandbox && levelConfig && (
        <div className="px-5 pt-3">
          <DidacticExplanationCard
            level={levelConfig}
            onPlayTarget={handlePlayTarget}
            onStopTarget={handleStop}
            isPlayingTarget={isPlayingTarget}
            onShowSolutionOnGrid={handleShowSolutionOnGrid}
            isSolutionVisibleOnGrid={isSolutionVisibleOnGrid}
            onNextLevel={onNextLevel}
          />
        </div>
      )}

      {/* ----------------- TOP TOOLBAR ----------------- */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-2.5 bg-white/95 border-b-2 border-amber-100 z-30">
        {/* Left: Playback & Stop Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleTogglePlay}
            className={`btn-playful px-4 py-2 flex items-center gap-2 text-white text-sm ${
              isPlaying
                ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-200'
                : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200'
            }`}
          >
            {isPlaying ? <Square className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
            <span>{isPlaying ? 'Ferma' : 'Ascolta'}</span>
          </button>
          <button type="button" className="editor-icon" onClick={goBack} disabled={!undo.length || isReadOnly} title="Annulla (Ctrl/⌘+Z)" aria-label="Annulla">↶</button>
          <button type="button" className="editor-icon" onClick={goForward} disabled={!redo.length || isReadOnly} title="Ripristina (Ctrl/⌘+Maiusc+Z)" aria-label="Ripristina">↷</button>

          <button
            onClick={handleStop}
            className="btn-playful px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm flex items-center gap-1.5"
            title="Ferma e riavvolgi"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Continuous Loop / Ripeti Toggle */}
          <button
            onClick={() => {
              const next = !isLooping;
              setIsLooping(next);
              settingsManager.set('continuousLoop', next);
            }}
            className={`btn-playful px-3 py-2 text-sm flex items-center gap-1.5 transition-all ${
              isLooping
                ? 'bg-rose-500 text-white shadow-playful-sm font-black'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
            title={isLooping ? 'Ripetizione continua attiva (clicca per disattivare)' : 'Attiva ripetizione continua delle partiture (Loop)'}
          >
            <Repeat className="w-4 h-4" />
            <span className="hidden sm:inline">{isLooping ? 'Loop Attivo' : 'Ripeti'}</span>
          </button>

          {/* Metronome Toggle */}
          <button
            onClick={() => setMetronomeEnabled(!metronomeEnabled)}
            className={`btn-playful px-3 py-2 text-sm flex items-center gap-1.5 ${
              metronomeEnabled
                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                : 'bg-slate-100 text-slate-400'
            }`}
            title="Metronomo sonoro sui quarti"
          >
            <Clock className="w-4 h-4" />
            <span className="hidden sm:inline">Metronomo</span>
          </button>

          {/* BPM Slider */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50/90 rounded-2xl border border-amber-200 text-xs font-bold text-slate-700">
            <span>BPM:</span>
            <span className="text-amber-800 w-8">{bpm}</span>
            <input
              type="range"
              min="50"
              max="160"
              step="2"
              value={bpm}
              onChange={(e) => {
                const val = Number(e.target.value);
                setBpm(val);
                audioEngine.setBpm(val);
              }}
              className="w-20 accent-amber-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Center: Laboratorio Libero DAW Switcher OR Dual View Toggle */}
        <div className="flex items-center gap-2">
          {/* If in Sandbox: Mode Selector between Tablatura Ritmica and Rigo Melodico */}
          {isSandbox && (
            <div className="flex items-center bg-amber-100/70 p-1 rounded-2xl border border-amber-300">
              <button
                onClick={() => setSandboxMode('rhythm')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                  sandboxMode === 'rhythm'
                    ? 'bg-sky-500 text-white shadow-sm'
                    : 'text-amber-900 hover:bg-amber-200/60'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Tablatura Ritmica</span>
              </button>

              <button
                 onClick={() => { setSandboxMode('melody'); setViewMode('conventional'); }}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                  sandboxMode === 'melody'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-amber-900 hover:bg-amber-200/60'
                }`}
              >
                <Music className="w-3.5 h-3.5" />
                <span>Rigo Melodico</span>
              </button>
            </div>
          )}

          {/* Dual View Toggle: Blocchi Proporzionali vs Notazione Convenzionale */}
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200">
            <button
              onClick={() => setViewMode('blocks')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'blocks'
                  ? 'bg-white text-amber-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Blocchi Proporzionali</span>
            </button>

            <button
              onClick={() => setViewMode('conventional')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'conventional'
                  ? 'bg-white text-amber-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Music className="w-3.5 h-3.5" />
              <span>Notazione Convenzionale</span>
            </button>
          </div>
        </div>

        {/* Right: Instrument Timbre & Chironomy & Bars Selector */}
        <div className="flex items-center gap-2">
          {isSandbox && (
            <>
              {/* Measure Count Selector (Extended to 32 bars) */}
              <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-2xl border border-amber-200 text-xs font-bold">
                <span className="text-slate-500">Battute:</span>
                {[1, 2, 4, 8, 12, 16, 24, 32].map(b => (
                  <button
                    key={b}
                    onClick={() => setSandboxBars(b)}
                    className={`px-1.5 py-0.5 rounded-lg transition-all ${
                      sandboxBars === b
                        ? 'bg-amber-400 text-amber-950 font-black shadow-xs'
                        : 'text-slate-600 hover:bg-amber-50'
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>

              {/* Time Signature Selector */}
              <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-2xl border border-amber-200 text-xs font-bold">
                <span className="text-slate-500">Tempo:</span>
                {['4/4', '3/4', '2/4', '6/8'].map(ts => (
                  <button
                    key={ts}
                    onClick={() => setTimeSignature(ts)}
                    className={`px-2 py-0.5 rounded-lg transition-all ${
                      timeSignature === ts
                        ? 'bg-purple-600 text-white font-black shadow-xs'
                        : 'text-slate-600 hover:bg-purple-50'
                    }`}
                  >
                    {ts}
                  </button>
                ))}
              </div>

              {/* Projects Modal Trigger Button */}
              <button
                onClick={() => setShowProjectModal(true)}
                className="btn-playful px-3 py-1.5 bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-amber-950 text-xs font-black rounded-2xl flex items-center gap-1.5 shadow-sm"
                title="Salva o carica le tue partiture libere"
              >
                <Save className="w-3.5 h-3.5" />
                <span>I Miei Brani</span>
              </button>
            </>
          )}

          {isMelodic && (
            <>
              {/* Melodic Staff Type in Sandbox */}
              {isSandbox && (
                <select
                  value={sandboxStaff}
                  onChange={(e) => setSandboxStaff(e.target.value)}
                  className="bg-white border border-amber-200 text-xs font-bold text-slate-700 px-2.5 py-1.5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-300"
                >
                  <option value="pentagram">🎼 Pentagramma (5 Linee)</option>
                  <option value="trigram">📐 Trigramma (3 Linee)</option>
                  <option value="bigram">➖ Bigramma (2 Linee)</option>
                </select>
              )}

              {/* In Curriculum Melodic: Toggle Pentagramma in Chiave di Sol */}
              {!isSandbox && (
                <button
                  onClick={() => {
                    const next = !forcePentagramStaff;
                    setForcePentagramStaff(next);
                    settingsManager.set('forceTrebleClef', next);
                  }}
                  className={`btn-playful px-2.5 py-1.5 text-xs flex items-center gap-1.5 transition-all ${
                    forcePentagramStaff
                      ? 'bg-amber-400 text-amber-950 font-black border border-amber-500 shadow-playful-sm'
                      : 'bg-white text-slate-700 border border-amber-200 hover:bg-amber-50'
                  }`}
                  title="Mostra la partitura su Pentagramma standard con Chiave di Sol (𝄞)"
                >
                  <span className="text-sm font-serif font-black">𝄞</span>
                  <span className="hidden sm:inline">
                    {forcePentagramStaff ? 'Pentagramma 𝄞 Attivo' : 'Passa a Pentagramma 𝄞'}
                  </span>
                </button>
              )}

              {/* Instrument timbre selector */}
              <select
                value={melodicInstrument}
                onChange={(e) => {
                  setMelodicInstrument(e.target.value);
                  audioEngine.setMelodicInstrument(e.target.value);
                }}
                className="bg-white border border-amber-200 text-xs font-bold text-slate-700 px-2.5 py-1.5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-300"
              >
                <option value="xylophone">🪵 Xilofono Orff</option>
                <option value="glockenspiel">🔔 Glockenspiel</option>
                <option value="flute">🪈 Flauto Dolce</option>
              </select>

              {/* Kodaly Chironomy Hand Signs Toggle */}
              <button
                onClick={() => {
                  const next = !showChironomy;
                  setShowChironomy(next);
                  settingsManager.set('showKodalySigns', next);
                }}
                className={`btn-playful px-2.5 py-1.5 text-xs flex items-center gap-1.5 ${
                  showChironomy
                    ? 'bg-purple-100 text-purple-800 border border-purple-300 font-bold'
                    : 'bg-slate-100 text-slate-400 border border-slate-200'
                }`}
                title="Attiva/disattiva segni delle mani Kodály"
              >
                <span>🖐️</span>
                <span className="hidden md:inline">Gesti Kodály</span>
              </button>
            </>
          )}

          {/* Delete selected & Clear all */}
          <button
            onClick={handleDeleteSelected}
            disabled={!selectedNoteId}
            className={`p-2 rounded-2xl border transition-all ${
              selectedNoteId
                ? 'bg-rose-100 text-rose-700 border-rose-300 hover:bg-rose-200'
                : 'bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed'
            }`}
            title="Elimina nota selezionata"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          <button
            onClick={handleClearAll}
            className="text-xs font-bold text-slate-500 hover:text-rose-600 px-2 py-1"
            title="Svuota l'intera partitura"
          >
            Svuota
          </button>

          {/* Next Level button in Curriculum mode */}
          {!isSandbox && onNextLevel && (
            <button
              onClick={onNextLevel}
              className="btn-playful px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black flex items-center gap-1.5 shadow-emerald-200 ml-1"
              title="Passa al prossimo livello didattico"
            >
              <span>Prossimo Livello</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Collapsible Section Toggles to optimize space */}
          <div className="flex items-center gap-1 border-l border-amber-200 pl-2 ml-1">
            <button
              onClick={() => setShowPalette(!showPalette)}
              className={`btn-playful px-2 py-1 text-[11px] font-black rounded-xl border flex items-center gap-1 transition-all ${
                showPalette
                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                  : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
              }`}
              title={showPalette ? "Nascondi palette figure per guadagnare spazio" : "Mostra palette figure"}
            >
              <span>🎼 Palette</span>
              <span className="text-[9px]">{showPalette ? '▲' : '▼'}</span>
            </button>

            <button
              onClick={() => setShowRightPanel(!showRightPanel)}
              className={`btn-playful px-2 py-1 text-[11px] font-black rounded-xl border flex items-center gap-1 transition-all ${
                showRightPanel
                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                  : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
              }`}
              title={showRightPanel ? "Nascondi torta e verifica per allargare il rigo" : "Mostra torta e verifica"}
            >
              <span>📊 Torta</span>
              <span className="text-[9px]">{showRightPanel ? '▶' : '◀'}</span>
            </button>

            {!isSandbox && levelConfig && (
              <button
                onClick={() => setShowDidacticCard(!showDidacticCard)}
                className={`btn-playful px-2 py-1 text-[11px] font-black rounded-xl border flex items-center gap-1 transition-all ${
                  showDidacticCard
                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                    : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                }`}
                title={showDidacticCard ? "Riduci spiegazione didattica" : "Mostra spiegazione didattica"}
              >
                <span>📖 Guida</span>
                <span className="text-[9px]">{showDidacticCard ? '▲' : '▼'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ----------------- PALETTE: MUSICAL FIGURES (INTERO 4/4, METÀ 2/4, QUARTO 1/4, OTTAVO 1/8, SEDICESIMO 1/16) ----------------- */}
      {showPalette && (
        <div className="flex items-center justify-between gap-3 px-5 py-2.5 bg-amber-50/70 border-b border-amber-200/80 overflow-x-auto z-20">
        <div className="flex items-center gap-2">
          <span className="text-xs font-black text-amber-900 uppercase tracking-wider mr-1">
            Figura:
          </span>

          {Object.entries(FIGURE_INFO).map(([key, info]) => {
            // Check if allowed in current level (always allowed in sandbox)
            if (!isSandbox && levelConfig?.allowedFigures && !levelConfig.allowedFigures.includes(key)) {
              return null;
            }

            const isCurrent = selectedFigure === key;
            return (
              <button
                key={key}
                onClick={() => changeFigure(key)}
                aria-pressed={isCurrent}
                className={`btn-playful px-3 py-1.5 flex items-center gap-1.5 text-xs transition-all ${
                  isCurrent
                    ? 'bg-amber-400 text-amber-950 shadow-playful-sm scale-105 border-amber-500'
                    : 'bg-white hover:bg-amber-100 text-slate-700 border border-amber-200'
                }`}
                title={`${info.label} (${info.beats} quarti)`}
              >
                <span className="text-lg leading-none font-bold">{info.symbol}</span>
                {/* Display the exact requested pedagogical name: Intero 4/4, Metà 2/4, Quarto 1/4, Ottavo 1/8, Sedicesimo 1/16 */}
                <span className="font-bold whitespace-nowrap">{info.label}</span>
              </button>
            );
          })}
          {isSandbox && (
            <button type="button" className="editor-icon" aria-pressed={dotted}
              disabled={selectedFigure.includes('sixteenth')} onClick={() => {
                setDotted(!dotted);
                changeFigure(selectedFigure, !dotted);
              }}>· Punto</button>
          )}
        </div>

        {/* Accidentals (# and b) if enabled or in sandbox */}
        {(isSandbox || levelConfig?.accidentalsEnabled) && (
          <div className="flex items-center gap-1.5 pl-4 border-l-2 border-amber-200">
            <span className="text-xs font-black text-amber-900 uppercase tracking-wider mr-1">
              Alterazione:
            </span>
            <button
              onClick={() => changeAccidental(1)}
              aria-pressed={selectedAccidental === 1}
              className={`btn-playful px-2.5 py-1 text-xs font-black rounded-xl border ${
                selectedAccidental === 1
                  ? 'bg-rose-400 text-white border-rose-500'
                  : 'bg-white text-slate-700 border-amber-200 hover:bg-rose-50'
              }`}
              title="Diesis: alza di mezzo tono (♯)"
            >
              ♯ Diesis
            </button>
            <button
              onClick={() => changeAccidental(-1)}
              aria-pressed={selectedAccidental === -1}
              className={`btn-playful px-2.5 py-1 text-xs font-black rounded-xl border ${
                selectedAccidental === -1
                  ? 'bg-sky-400 text-white border-sky-500'
                  : 'bg-white text-slate-700 border-amber-200 hover:bg-sky-50'
              }`}
              title="Bemolle: abbassa di mezzo tono (♭)"
            >
              ♭ Bemolle
            </button>
            <button type="button" className="editor-icon" aria-pressed={selectedAccidental === 0} onClick={() => changeAccidental(0)}>♮ Naturale</button>
          </div>
        )}
      </div>
      )}

      <div className="score-status" role="status">
        {editMessage || `Battuta ${1 + Math.floor(Math.min(cursor.step, totalSteps - 1) / sixteenthsPerBar)} · ${activeRows[Math.min(cursor.row, activeRows.length - 1)]?.label || ''} · Frecce: naviga · Invio: inserisci · Maiusc + frecce: sposta · Canc: elimina`}
      </div>
      {/* ----------------- WORKSPACE BODY: TRACK HEADERS + 2D GRID ----------------- */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Track Headers (Left sidebar) */}
        <div className="w-40 bg-white/95 border-r-2 border-amber-200 flex flex-col z-20 shadow-sm flex-shrink-0">
          <div className="h-8 border-b border-amber-100 flex items-center justify-between px-3 text-[10px] font-black text-slate-400 uppercase tracking-wider">
            <span>{isMelodic ? 'Altezza / Nota' : 'Strumento'}</span>
            <span>Ascolta</span>
          </div>

          <div className="flex-1 overflow-hidden">
            <div ref={rowLabelsRef}>
            {activeRows.map((row) => (
              <button type="button"
                key={row.id}
                onClick={() => {
                  if (row.pitch) {
                    audioEngine.playNote(row.pitch, 0.4);
                  } else if (row.sound) {
                    audioEngine.playSoundByName(row.sound);
                  }
                }}
                className="flex w-full items-center justify-between px-3 border-b border-slate-100/80 cursor-pointer hover:bg-indigo-50 transition-colors group"
                style={{ height: `${rowHeight}px` }}
                title={`Clicca per ascoltare: ${row.label}`}
              >
                <div className="flex items-center gap-1.5 overflow-hidden">
                  {viewMode === 'blocks' && <span className="text-base select-none">{row.icon || '🎵'}</span>}
                  <span className="text-xs font-black text-slate-700 group-hover:text-amber-800 truncate">
                    {row.voice === 2 ? 'II · ' : ''}{row.label}
                  </span>
                </div>
                <Volume2 className="w-3.5 h-3.5 text-slate-300 group-hover:text-amber-600 flex-shrink-0" />
              </button>
            ))}
            </div>
          </div>
        </div>

        {/* 2D Music Grid (Horizontal scrollable) */}
        <div
          ref={gridContainerRef}
          onScroll={e => {
            if (rowLabelsRef.current) rowLabelsRef.current.style.transform = `translateY(${-e.currentTarget.scrollTop}px)`;
          }}
          className="flex-1 overflow-x-auto overflow-y-auto relative bg-white/80 cursor-default"
        >
          {/* Timeline numbers (Top bar of grid) */}
          <div
            className="h-8 border-b-2 border-amber-200 bg-amber-50/50 flex relative select-none sticky top-0 z-20"
            style={{ width: `${staffIndent + totalSteps * stepWidth}px` }}
          >
            {Array.from({ length: totalBars }).map((_, barIdx) => (
              <div
                key={`bar-head-${barIdx}`}
                className="absolute top-0 bottom-0 border-r-2 border-slate-700 flex items-center px-2 text-xs font-black text-amber-900"
                style={{ left: `${staffIndent + barIdx * sixteenthsPerBar * stepWidth}px`, width: `${sixteenthsPerBar * stepWidth}px` }}
              >
                <span>Battuta {barIdx + 1}</span>
                <span className="ml-auto text-[10px] text-amber-700/70 font-bold">{timeSignature}</span>
              </div>
            ))}
          </div>

          {/* The Staff Background & Lines */}
          <div
            ref={staffAreaRef}
            onClick={handleGridClick}
            onKeyDown={handleScoreKeys}
            tabIndex={isReadOnly ? undefined : 0}
            role="group"
            aria-label="Editor della partitura. Frecce per navigare, Invio per inserire, Maiusc e frecce per spostare."
            className="relative cursor-crosshair score-area"
            style={{ width: `${staffIndent + totalSteps * stepWidth}px` }}
          >
            {viewMode === 'conventional' ? <>
              <ScoreStaff rows={activeRows} rowHeight={rowHeight} stepWidth={stepWidth} indent={staffIndent}
                totalSteps={totalSteps} signature={timeSignature} treble={showClef} />
              <ScoreNotes rows={activeRows} notes={notes} rowHeight={rowHeight} stepWidth={stepWidth}
                indent={staffIndent} totalSteps={totalSteps} signature={timeSignature} selectedId={selectedNoteId} />
            </> : <StaffRenderer
              staffType={staffType}
              activeRows={activeRows}
              stepWidth={stepWidth}
              rowHeight={rowHeight}
              totalSteps={totalSteps}
              timeSignature={timeSignature}
              indent={staffIndent}
            />}
            <div className="score-cursor" aria-hidden="true" style={{
              left: staffIndent + Math.min(cursor.step, totalSteps - 1) * stepWidth,
              top: Math.min(cursor.row, activeRows.length - 1) * rowHeight,
              width: stepWidth, height: rowHeight,
            }} />

            {/* Ghost Snap preview when hovering/dragging */}
            {ghostSnap && (
              <div
                className="absolute pointer-events-none rounded-xl border-2 border-dashed border-purple-500 bg-purple-300/30 transition-all z-20"
                style={{
                  left: `${staffIndent + ghostSnap.step * stepWidth}px`,
                  top: `${ghostSnap.rowIdx * rowHeight + 2}px`,
                  width: `${(viewMode === 'conventional' ? 1 : (draggedNote?.duration || toolDuration())) * stepWidth - 4}px`,
                  height: `${rowHeight - 4}px`,
                }}
              />
            )}

            {/* Placed Musical Notes */}
            {notes.map((note) => {
              const rowIdx = activeRows.findIndex(r => r.id === note.rowId);
              if (rowIdx === -1) return null;

               const restRow = note.isRest && viewMode === 'conventional' && isMelodic
                 ? activeRows.findIndex(row => row.id === (activeRows[rowIdx].voice === 2 ? 'v2:SI' : 'SI')) : -1;
               const topPx = (restRow >= 0 ? restRow : rowIdx) * rowHeight;
              const isSelected = selectedNoteId === note.id;

              return (
                <div
                  key={note.id}
                   onPointerDown={(e) => handleStartDragExisting(note, e)}
                  style={{
                    position: 'absolute',
                    top: `${topPx}px`,
                    height: `${rowHeight}px`,
                  }}
                >
                   {viewMode === 'conventional' ? (
                     <button type="button" tabIndex={-1}
                       aria-label={`${note.isRest ? 'Pausa' : activeRows[rowIdx].label}, battuta ${Math.floor(note.step / sixteenthsPerBar) + 1}`}
                       className={`score-note-hit ${isSelected ? 'is-selected' : ''}`}
                       style={{ left: staffIndent + note.step * stepWidth, width: stepWidth, height: rowHeight }}
                       onClick={e => {
                         e.stopPropagation();
                         staffAreaRef.current?.focus({ preventScroll: true });
                         setSelectedNoteId(note.id);
                         setCursor({ step: note.step, row: rowIdx });
                       }} />
                   ) : <NoteRenderer
                    note={note}
                    viewMode={viewMode}
                    stepWidth={stepWidth}
                    rowHeight={rowHeight}
                    indent={staffIndent}
                    showChironomy={showChironomy}
                    isSelected={isSelected}
                    onSelect={(n) => setSelectedNoteId(n.id)}
                   />}
                </div>
              );
            })}

            {/* Playhead Line */}
            {(isPlaying || isPlayingTarget) && (
              <div
                 className="absolute top-0 bottom-0 w-[2px] bg-violet-600 pointer-events-none z-30"
                 style={{ transform: `translate3d(${staffIndent + playheadPosPx}px, 0, 0)` }}
              >
                {/* Glowing Playhead cap */}
                <div className="absolute -top-1.5 -left-1.5 w-4 h-4 bg-rose-600 rounded-full border-2 border-white shadow-md animate-pulse" />
              </div>
            )}
          </div>
        </div>

        {/* Right Floating Widget: Animated Pie Chart & Mathematical Bar Verification */}
        {showRightPanel && (
          <div className="w-56 bg-amber-50/60 border-l-2 border-amber-200 p-4 flex flex-col justify-between overflow-y-auto z-20 flex-shrink-0 animate-fade-in">
            <div>
              {/* Animated Pie Chart with Solfeggio Conducting Order & Note Duration Filling */}
              <PieCycleChart
                currentBeat={currentBeat}
                beatProgress={beatProgress}
                currentStep={currentStep}
                notes={notes}
                timeSignature={timeSignature}
              />

              {/* Mathematical Verification Panel */}
              <div className="mt-4 p-3 bg-white rounded-2xl shadow-playful-sm border border-amber-200">
                <div className="text-xs font-black text-amber-900 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>Verifica {timeSignature}</span>
                  </div>
                  <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded">
                    {sixteenthsPerBar}/16
                  </span>
                </div>

                <div className="space-y-2">
                  {barFractions.map((bar) => (
                    <div
                      key={`bar-status-${bar.barNumber}`}
                      className={`p-2 rounded-xl text-xs font-bold border transition-colors ${
                        bar.isComplete
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                          : bar.isOverflow
                          ? 'bg-rose-50 border-rose-300 text-rose-800'
                          : 'bg-amber-50 border-amber-200 text-amber-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>Battuta {bar.barNumber}:</span>
                        <span className="font-black">{bar.totalSixteenths}/{sixteenthsPerBar} sedicesimi</span>
                      </div>

                      <div className="mt-1 flex items-center gap-1 text-[11px]">
                        {bar.isComplete ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                            <span>Perfetto! Battuta piena</span>
                          </>
                        ) : bar.isOverflow ? (
                          <>
                            <AlertCircle className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
                            <span>Troppe note (+{bar.totalSixteenths - sixteenthsPerBar}/16)</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                            <span>Mancano {sixteenthsPerBar - bar.totalSixteenths} sedicesimi</span>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Help Tip */}
            <div className="mt-3 p-2.5 bg-amber-100/70 rounded-xl text-[11px] text-amber-900 leading-snug">
              <span className="font-bold">💡 Istruzioni:</span>
              <ul className="mt-1 space-y-0.5 list-disc list-inside">
                <li>Clicca per inserire la figura sul rigo.</li>
                <li>Trascina per spostare (tempo e altezza).</li>
                <li>La battuta è completa quando fa {timeSignature}.</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Free Projects Save & Load Modal */}
      <ProjectManagerModal
        isOpen={showProjectModal}
        onClose={() => setShowProjectModal(false)}
        currentProjectData={{
          notes,
          bpm,
          timeSignature,
          sandboxMode,
          sandboxStaff,
          sandboxBars,
        }}
        onLoadProject={(proj) => {
          setNotes(proj.notes || []);
          if (proj.bpm) {
            setBpm(proj.bpm);
            audioEngine.setBpm(proj.bpm);
          }
          if (proj.timeSignature) setTimeSignature(proj.timeSignature);
          if (proj.sandboxBars) setSandboxBars(proj.sandboxBars);
          if (proj.sandboxMode) setSandboxMode(proj.sandboxMode);
          if (proj.sandboxStaff) setSandboxStaff(proj.sandboxStaff);
          if (onNotesChange) onNotesChange(proj.notes || []);
        }}
      />
    </div>
  );
}
