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
import { scorePage } from '../engine/ScoreLayout';

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
  const [playheadPosition, setPlayheadPosition] = useState(0);
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
  const fontProbeRef = useRef(null);
  const [scoreWidth, setScoreWidth] = useState(420);
  const [rootFont, setRootFont] = useState(16);
  const [viewportHeight, setViewportHeight] = useState(() => window.innerHeight);
  const [voiceView, setVoiceView] = useState('auto');
  const [pageAnchor, setPageAnchor] = useState(0);
  const [toolsOpen, setToolsOpen] = useState(false);

  useEffect(() => {
    const target = gridContainerRef.current;
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        if (entry.target === target) setScoreWidth(Math.floor(entry.contentRect.width));
        else setRootFont(entry.contentRect.width);
      }
    });
    observer.observe(target);
    observer.observe(fontProbeRef.current);
    const onResize = () => setViewportHeight(window.innerHeight);
    window.addEventListener('resize', onResize);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', onResize);
    };
  }, []);

  const rowHeight = viewMode === 'conventional' ? Math.max(16, Math.ceil(rootFont * .84))
    : viewportHeight < 44 * rootFont ? 26 : Math.max(30, Math.ceil(rootFont * 1.35));

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
  const showClef = viewMode === 'conventional' && (staffType === 'pentagram' || staffType === 'dual');
  const staffIndent = showClef ? Math.min(Math.round(86 * rowHeight / 16), Math.max(36, Math.floor(scoreWidth * .28)))
    : viewMode === 'conventional' ? 18 : 0;
  const playing = isPlaying || isPlayingTarget;
  const layout = scorePage({ width: scoreWidth, indent: staffIndent, barSteps: sixteenthsPerBar, bars: totalBars,
    anchorStep: playing ? playheadPosition : pageAnchor });
  const { stepWidth, start: pageStart, steps: pageSteps, visibleBars, firstBar } = layout;
  const pageEnd = pageStart + pageSteps;
  const pageWidth = staffIndent + pageSteps * stepWidth;
  const jumpToPage = (page) => {
    const step = page * layout.barsPerPage * sixteenthsPerBar;
    setPageAnchor(step);
    setCursor(position => ({ ...position, step }));
    setSelectedNoteId(null);
  };

  const allRows = React.useMemo(() => {
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
  const automaticVoice = viewportHeight < 34 * rootFont ? 'first' : 'both';
  const shownVoice = voiceView === 'auto' ? automaticVoice : voiceView;
  const activeRows = staffType !== 'dual' || shownVoice === 'both' ? allRows
    : allRows.filter(row => shownVoice === 'second' ? row.voice === 2 : row.voice !== 2);

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
              const row = allRows.find(r => r.id === n.rowId);
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
          setPlayheadPosition(progress.position);
          setCurrentBeat(progress.measureBeat);
          setBeatProgress(progress.beatProgress);
        },
        () => {
          setIsPlaying(false);
          setCurrentStep(0);
          setPlayheadPosition(0);
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
          setPlayheadPosition(progress.position);
        setCurrentBeat(progress.measureBeat);
        setBeatProgress(progress.beatProgress);
      },
      () => {
        setIsPlayingTarget(false);
        setCurrentStep(0);
        setPlayheadPosition(0);
        setCurrentBeat(1);
      }
    );
  };

  const handleStop = () => {
    audioEngine.stopPlayback();
    setIsPlaying(false);
    setIsPlayingTarget(false);
    setCurrentStep(0);
    setPlayheadPosition(0);
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

    if (relX < 0 || relY < 0 || relX >= pageSteps * stepWidth || relY >= activeRows.length * rowHeight) return null;

    // Snap to 1/16th note on X
    const rawStep = Math.floor(relX / stepWidth);
    const step = pageStart + rawStep;

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
    if (isReadOnly || playing) return;
    const snap = calculateSnap(e.clientX, e.clientY);
    if (!snap) return;
    staffAreaRef.current?.focus({ preventScroll: true });
    setCursor({ step: snap.step, row: snap.rowIdx });
    setPageAnchor(snap.step);
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
    if (isReadOnly || playing || e.button !== 0) return;
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
    if (isReadOnly || playing || e.altKey) return;
    const row = Math.min(cursor.row, activeRows.length - 1);
    const step = Math.max(pageStart, Math.min(cursor.step, pageEnd - 1));
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
      setPageAnchor(nextStep);
      requestAnimationFrame(() => staffAreaRef.current?.querySelector('.score-cursor')
        ?.scrollIntoView({ block: 'nearest', inline: 'nearest' }));
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
  const [showRightPanel, setShowRightPanel] = useState(false);
  const [showPalette, setShowPalette] = useState(true);
  const [showDidacticCard, setShowDidacticCard] = useState(false);

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
      className="studio-panel score-editor flex flex-col select-none"
      onPointerMove={handleMouseMove}
      onPointerUp={handleMouseUp}
      onPointerCancel={() => { setDraggedNote(null); setGhostSnap(null); }}
    >
      <span className="score-font-probe" ref={fontProbeRef} aria-hidden="true" />
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
      <div className="score-toolbar bg-white/95 border-b border-indigo-100">
        {/* Left: Playback & Stop Controls */}
        <div className="score-control-group">
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
          <button type="button" className="editor-icon" aria-controls="score-tools" aria-expanded={toolsOpen}
            onClick={() => setToolsOpen(open => !open)}>Strumenti</button>
          <button type="button" className="editor-icon" aria-expanded={showRightPanel}
            onClick={() => setShowRightPanel(open => !open)}>Verifica</button>
          {!isSandbox && <button type="button" className="editor-icon" aria-expanded={showDidacticCard}
            onClick={() => setShowDidacticCard(open => !open)}>Guida</button>}
        </div>

        <div id="score-tools" className="score-extra" hidden={!toolsOpen}>
        <div className="score-control-group">
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
            <span className="score-tool-label">{isLooping ? 'Loop attivo' : 'Ripeti'}</span>
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
            <span className="score-tool-label">Metronomo</span>
          </button>

          {/* BPM Slider */}
          <label className="score-bpm bg-amber-50/90 rounded-xl border border-amber-200 text-xs font-bold text-slate-700">
            <span>BPM:</span>
            <span className="text-amber-800">{bpm}</span>
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
              className="accent-amber-500 cursor-pointer"
            />
          </label>
        </div>

        {/* Center: Laboratorio Libero DAW Switcher OR Dual View Toggle */}
        <div className="score-control-group">
          {/* If in Sandbox: Mode Selector between Tablatura Ritmica and Rigo Melodico */}
          {isSandbox && (
            <label className="score-control-group text-xs font-bold">
              Tipo
              <select aria-label="Tipo di laboratorio" value={sandboxMode} onChange={event => {
                setSandboxMode(event.target.value);
                if (event.target.value === 'melody') setViewMode('conventional');
              }}>
                <option value="rhythm">Ritmico</option>
                <option value="melody">Melodico</option>
              </select>
            </label>
          )}
          <label className="score-control-group text-xs font-bold">
            Vista
            <select aria-label="Vista" value={viewMode} onChange={event => setViewMode(event.target.value)}>
              <option value="blocks">Blocchi</option>
              <option value="conventional">Notazione</option>
            </select>
          </label>
        </div>

        {/* Right: Instrument Timbre & Chironomy & Bars Selector */}
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          {isSandbox && (
            <>
              {/* Measure Count Selector (Extended to 32 bars) */}
              <label className="score-control-group text-xs font-bold">
                Numero di battute
                <select value={sandboxBars} onChange={event => setSandboxBars(Number(event.target.value))}>
                  {[1, 2, 4, 8, 12, 16, 24, 32].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </label>

              {/* Time Signature Selector */}
              <label className="score-control-group text-xs font-bold">
                Metro
                <select value={timeSignature} onChange={event => setTimeSignature(event.target.value)}>
                  {['4/4', '3/4', '2/4', '6/8'].map(meter => <option key={meter} value={meter}>{meter}</option>)}
                </select>
              </label>

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
                  aria-label="Tipo di rigo"
                  value={sandboxStaff}
                  onChange={(e) => setSandboxStaff(e.target.value)}
                  className="bg-white border border-amber-200 text-xs font-bold text-slate-700 px-2.5 py-1.5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-300"
                >
                  <option value="pentagram">🎼 Pentagramma (5 Linee)</option>
                  <option value="trigram">📐 Trigramma (3 Linee)</option>
                  <option value="bigram">➖ Bigramma (2 Linee)</option>
                  <option value="dual">🎼 Doppio rigo (2 voci)</option>
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
                aria-label="Strumento melodico"
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
              {viewMode === 'blocks' && <button
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
              </button>}
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

          </div>
        </div>
        </div>

      {/* ----------------- PALETTE: MUSICAL FIGURES (INTERO 4/4, METÀ 2/4, QUARTO 1/4, OTTAVO 1/8, SEDICESIMO 1/16) ----------------- */}
      {showPalette && (
         <div className="score-palette score-control-group">
        <div className="score-control-group">
          <label className="score-control-group font-bold">
            Figura
            <select value={selectedFigure} onChange={event => changeFigure(event.target.value)}>
              {Object.entries(FIGURE_INFO)
                .filter(([key]) => isSandbox || !levelConfig?.allowedFigures || levelConfig.allowedFigures.includes(key))
                .map(([key, info]) => <option key={key} value={key}>{info.symbol} {info.label}</option>)}
            </select>
          </label>
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
          <div className="score-control-group" role="group" aria-label="Alterazione">
            <button
              onClick={() => changeAccidental(1)}
              aria-label="Diesis"
              aria-pressed={selectedAccidental === 1}
              className={`btn-playful px-2.5 py-1 text-xs font-black rounded-xl border ${
                selectedAccidental === 1
                  ? 'bg-rose-400 text-white border-rose-500'
                  : 'bg-white text-slate-700 border-amber-200 hover:bg-rose-50'
              }`}
              title="Diesis: alza di mezzo tono (♯)"
            >
              <span aria-hidden="true">♯</span><span className="score-tool-label"> Diesis</span>
            </button>
            <button
              onClick={() => changeAccidental(-1)}
              aria-label="Bemolle"
              aria-pressed={selectedAccidental === -1}
              className={`btn-playful px-2.5 py-1 text-xs font-black rounded-xl border ${
                selectedAccidental === -1
                  ? 'bg-sky-400 text-white border-sky-500'
                  : 'bg-white text-slate-700 border-amber-200 hover:bg-sky-50'
              }`}
              title="Bemolle: abbassa di mezzo tono (♭)"
            >
              <span aria-hidden="true">♭</span><span className="score-tool-label"> Bemolle</span>
            </button>
            <button type="button" className="editor-icon" aria-label="Naturale" aria-pressed={selectedAccidental === 0} onClick={() => changeAccidental(0)}>♮<span className="score-tool-label"> Naturale</span></button>
          </div>
        )}
      </div>
       )}
      </div>

      {(layout.pageCount > 1 || staffType === 'dual' || playing) && <nav className="score-pages" aria-label="Pagine della partitura">
        <button type="button" className="editor-icon" disabled={playing || layout.page === 0}
          aria-label="Pagina precedente" onClick={() => jumpToPage(layout.page - 1)}>←</button>
        <label className="score-control-group">
          <span>Battute</span>
          <select value={layout.page} disabled={playing} aria-label="Vai alle battute"
            onChange={event => jumpToPage(Number(event.target.value))}>
            {Array.from({ length: layout.pageCount }, (_, page) => {
              const first = page * layout.barsPerPage + 1;
              const last = Math.min(totalBars, first + layout.barsPerPage - 1);
              return <option key={page} value={page}>{first === last ? first : `${first}–${last}`}</option>;
            })}
          </select>
        </label>
        <button type="button" className="editor-icon" disabled={playing || layout.page + 1 === layout.pageCount}
          aria-label="Pagina successiva" onClick={() => jumpToPage(layout.page + 1)}>→</button>
        <span className="score-page-mode">{playing ? 'Segue la riproduzione' : `${layout.page + 1} / ${layout.pageCount}`}</span>
        {staffType === 'dual' && (
          <label className="score-control-group">
            <span>Voci</span>
            <select value={voiceView} aria-label="Voci visibili" onChange={event => {
              setVoiceView(event.target.value);
              setCursor(position => ({ ...position, row: 0 }));
              setSelectedNoteId(null);
            }}>
              <option value="auto">{automaticVoice === 'first' ? 'Auto: prima voce' : 'Auto: entrambe'}</option>
              <option value="both">Entrambe</option>
              <option value="first">Prima voce</option>
              <option value="second">Seconda voce</option>
            </select>
          </label>
        )}
        <span className="score-cursor-status" role="status">
          {!playing && `Battuta ${1 + Math.floor(Math.max(pageStart, Math.min(cursor.step, pageEnd - 1)) / sixteenthsPerBar)} · ${activeRows[Math.min(cursor.row, activeRows.length - 1)]?.label || ''}`}
        </span>
      </nav>}
      {editMessage && <p className="score-status" role="status">{editMessage}</p>}
      {/* ----------------- WORKSPACE BODY: TRACK HEADERS + 2D GRID ----------------- */}
      <div className="score-workspace">
        {/* Track Headers (Left sidebar) */}
        <div className="score-row-labels bg-white/95 border-r border-indigo-100">
          <div className="score-timeline-label">
            {isMelodic ? 'Note' : 'Tracce'}
          </div>

          <div>
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
                className="score-row-button flex w-full items-center border-b border-slate-100/80 cursor-pointer hover:bg-indigo-50"
                style={{ height: `${rowHeight}px` }}
                title={`Ascolta: ${row.label}`}
                aria-label={`Ascolta ${row.voice === 2 ? 'seconda voce, ' : ''}${row.label}`}
              >
                <div className="flex items-center gap-1.5 overflow-hidden">
                  {!isMelodic && <span aria-hidden="true" className="score-row-icon">{row.icon}</span>}
                  <span className={`font-bold text-slate-700 truncate ${isMelodic ? '' : 'score-track-name'}`}>
                    {row.voice === 2 ? 'Ⅱ ' : ''}{row.label.split(' (')[0]}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 2D Music Grid (Horizontal scrollable) */}
        <div
          ref={gridContainerRef}
          className="score-viewport bg-white/80"
        >
          {/* Timeline numbers (Top bar of grid) */}
          <div
            className="score-timeline-label bg-amber-50/50 relative"
            style={{ width: pageWidth }}
          >
            {Array.from({ length: visibleBars }).map((_, barIdx) => (
              <div
                key={`bar-head-${barIdx}`}
                 className="score-bar-title absolute top-0 bottom-0 border-r border-slate-700 flex items-center font-black text-amber-900"
                style={{ left: `${staffIndent + barIdx * sixteenthsPerBar * stepWidth}px`, width: `${sixteenthsPerBar * stepWidth}px` }}
              >
                 <span>Battuta {firstBar + barIdx + 1}</span>
                 <span className="score-bar-meter ml-auto text-[10px] text-amber-700/70 font-bold">{timeSignature}</span>
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
            style={{ width: pageWidth }}
          >
            {viewMode === 'conventional' ? <>
              <ScoreStaff rows={activeRows} rowHeight={rowHeight} stepWidth={stepWidth} indent={staffIndent}
                totalSteps={pageSteps} signature={timeSignature} treble={showClef} />
              <ScoreNotes rows={activeRows} notes={notes} rowHeight={rowHeight} stepWidth={stepWidth}
                indent={staffIndent} totalSteps={totalSteps} startStep={pageStart} visibleSteps={pageSteps}
                signature={timeSignature} selectedId={selectedNoteId} />
            </> : <StaffRenderer
              staffType={isMelodic ? 'trigram' : staffType}
              activeRows={activeRows}
              stepWidth={stepWidth}
              rowHeight={rowHeight}
              totalSteps={pageSteps}
              timeSignature={timeSignature}
              indent={staffIndent}
            />}
            <div className="score-cursor" aria-hidden="true" style={{
              left: staffIndent + (Math.max(pageStart, Math.min(cursor.step, pageEnd - 1)) - pageStart) * stepWidth,
              top: Math.min(cursor.row, activeRows.length - 1) * rowHeight,
              width: stepWidth, height: rowHeight,
            }} />

            {/* Ghost Snap preview when hovering/dragging */}
            {ghostSnap && (
              <div
                className="absolute pointer-events-none rounded-xl border-2 border-dashed border-purple-500 bg-purple-300/30 transition-all z-20"
                style={{
                   left: `${staffIndent + (ghostSnap.step - pageStart) * stepWidth}px`,
                  top: `${ghostSnap.rowIdx * rowHeight + 2}px`,
                  width: `${(viewMode === 'conventional' ? 1 : (draggedNote?.duration || toolDuration())) * stepWidth - 4}px`,
                  height: `${rowHeight - 4}px`,
                }}
              />
            )}

            {/* Placed Musical Notes */}
            {notes.map((note) => {
               const noteEnd = note.step + (note.duration || 4);
               if (note.step >= pageEnd || noteEnd <= pageStart) return null;
               const visibleStart = Math.max(note.step, pageStart);
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
                   onClick={(e) => {
                     e.stopPropagation();
                     if (isReadOnly || playing) return;
                     staffAreaRef.current?.focus({ preventScroll: true });
                     setSelectedNoteId(note.id);
                     setCursor({ step: visibleStart, row: rowIdx });
                     setPageAnchor(visibleStart);
                   }}
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
                       style={{ left: staffIndent + (visibleStart - pageStart) * stepWidth, width: stepWidth, height: rowHeight }}
                     />
                   ) : <NoteRenderer
                     note={{ ...note, step: visibleStart - pageStart }}
                     visibleDuration={Math.min(noteEnd, pageEnd) - visibleStart}
                    viewMode={viewMode}
                    stepWidth={stepWidth}
                    rowHeight={rowHeight}
                    indent={staffIndent}
                    showChironomy={showChironomy}
                    isSelected={isSelected}
                     onSelect={() => {
                       if (isReadOnly || playing) return;
                       setSelectedNoteId(note.id);
                       setCursor({ step: visibleStart, row: rowIdx });
                       setPageAnchor(visibleStart);
                       staffAreaRef.current?.focus({ preventScroll: true });
                     }}
                   />}
                </div>
              );
            })}

            {/* Playhead Line */}
            {(isPlaying || isPlayingTarget) && (
              <div
                 className="absolute top-0 bottom-0 w-[2px] bg-violet-600 pointer-events-none z-30"
                   style={{ transform: `translate3d(${staffIndent + Math.min(pageSteps, playheadPosition - pageStart) * stepWidth}px, 0, 0)` }}
              >
                {/* Glowing Playhead cap */}
                <div className="absolute -top-1.5 -left-1.5 w-4 h-4 bg-rose-600 rounded-full border-2 border-white shadow-md animate-pulse" />
              </div>
            )}
          </div>
        </div>
      </div>

        {/* Right Floating Widget: Animated Pie Chart & Mathematical Bar Verification */}
        {showRightPanel && (
           <dialog className="studio-dialog score-inspector bg-white rounded-2xl border border-indigo-200"
             aria-label="Verifica delle battute" ref={dialog => { if (dialog && !dialog.open) dialog.showModal(); }}
             onClose={() => setShowRightPanel(false)}>
             <div className="score-inspector-header">
               <h3 className="font-bold">Verifica delle battute</h3>
               <form method="dialog"><button type="submit" className="editor-icon">Chiudi</button></form>
             </div>
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
                   {barFractions.slice(firstBar, firstBar + visibleBars).map((bar) => (
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
          </dialog>
        )}

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
