import React, { useState, useEffect } from 'react';
import {
  Music,
  Activity,
  Layers,
  Award,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Volume2,
  Sparkles,
  HelpCircle,
  Menu,
  CheckCircle2,
  Play,
  Settings as SettingsIcon,
  ArrowRight
} from 'lucide-react';
import GridEditor from './components/GridEditor';
import RhythmTapGame from './components/RhythmTapGame';
import DictationGame from './components/DictationGame';
import LevelSelector from './components/LevelSelector';
import InstrumentariumModal from './components/InstrumentariumModal';
import SettingsModal from './components/SettingsModal';
import UpdateModal from './components/UpdateModal';
import { levelManager } from './engine/LevelManager';
import { settingsManager } from './engine/SettingsManager';
import { audioEngine } from './engine/AudioEngine';
import { ALL_LEVELS } from './data/curriculum';

const SANDBOX = { id: 'SANDBOX', isSandbox: true, bpm: 90, accidentalsEnabled: true };

export default function App() {
  const [currentLevelId, setCurrentLevelId] = useState('R1');
  const [appMode, setAppMode] = useState('curriculum'); // 'curriculum' | 'sandbox'
  const [subMode, setSubMode] = useState('editor'); // 'editor' | 'tap' | 'dictation'
  const [showLevelSelector, setShowLevelSelector] = useState(false);
  const [showInstrumentarium, setShowInstrumentarium] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [userScoreNotes, setUserScoreNotes] = useState([]);
  const [sandboxNotes, setSandboxNotes] = useState([]);
  const [stats, setStats] = useState(levelManager.getOverallStatistics());

  // Listen to settings updates
  useEffect(() => {
    const unsub = settingsManager.subscribe(() => {
      setStats(levelManager.getOverallStatistics());
    });
    return unsub;
  }, []);

  // Avvia il controllo aggiornamenti (solo nella versione impacchettata).
  useEffect(() => {
    const api = window.ritmoLabAPI;
    if (api && api.updates) {
      setShowUpdateModal(true);
    }
  }, []);

  // Current level data
  const currentLevel = levelManager.getLevelById(currentLevelId);

  // Sync level initial state
  useEffect(() => {
    if (currentLevel) {
      setUserScoreNotes(currentLevel.targetNotes || []);
      if (currentLevel.type === 'dictation') {
        setSubMode('dictation');
      } else if (currentLevel.type === 'tap') {
        setSubMode('tap');
      } else {
        setSubMode('editor');
      }
    }
  }, [currentLevelId]);

  const handleNextLevel = () => {
    audioEngine.stopPlayback();
    const currentIdx = ALL_LEVELS.findIndex(l => l.id === currentLevelId);
    if (currentIdx < ALL_LEVELS.length - 1) {
      const nextId = ALL_LEVELS[currentIdx + 1].id;
      levelManager.unlockLevel(nextId);
      setCurrentLevelId(nextId);
    }
  };

  const handlePrevLevel = () => {
    audioEngine.stopPlayback();
    const currentIdx = ALL_LEVELS.findIndex(l => l.id === currentLevelId);
    if (currentIdx > 0) {
      const prevId = ALL_LEVELS[currentIdx - 1].id;
      setCurrentLevelId(prevId);
    }
  };

  const handleLevelComplete = ({ levelId, stars, accuracy, autoAdvance = true }) => {
    levelManager.recordLevelCompletion(levelId, { stars, accuracy, savedNotes: userScoreNotes });
    setStats(levelManager.getOverallStatistics());
    if (autoAdvance) {
      handleNextLevel();
    }
  };

  const currentIdx = ALL_LEVELS.findIndex(l => l.id === currentLevelId);
  const hasPrev = currentIdx > 0;
  const hasNext = currentIdx < ALL_LEVELS.length - 1;
  const levelStatus = levelManager.getLevelStatus(currentLevelId);

  return (
    <div className="studio-shell select-none">
      {/* ----------------- TOP GLOBAL NAVBAR ----------------- */}
      <header className="studio-header">
        {/* Brand Logo & Name */}
        <div className="studio-identity flex items-center gap-2">
          <div className="studio-logo rounded-xl bg-gradient-to-tr from-amber-400 to-rose-400 grid place-items-center text-white text-xl font-black">
            𝄢
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="studio-brand text-xl font-black tracking-tight">
                Ritmo<span className="text-violet-300">Lab</span>
              </span>
              <span className="studio-edition bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full">
                Scuola Primaria
              </span>
            </div>
          </div>
        </div>

        {/* Center: Navigation between Curriculum & Free Sandbox */}
        <nav aria-label="Modalità" className="studio-nav bg-indigo-50 p-1 rounded-2xl border border-indigo-200">
          <button
            onClick={() => {
              setAppMode('curriculum');
              setShowLevelSelector(false);
            }}
            aria-pressed={appMode === 'curriculum'}
            className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
              appMode === 'curriculum'
                ? 'bg-amber-400 text-amber-950 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span className="nav-long">Percorso Didattico</span><span className="nav-short">Percorso</span>
          </button>

          <button
            onClick={() => {
              setAppMode('sandbox');
              setShowLevelSelector(false);
            }}
            aria-pressed={appMode === 'sandbox'}
            className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
              appMode === 'sandbox'
                ? 'bg-amber-400 text-amber-950 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span className="nav-long">Laboratorio Libero</span><span className="nav-short">Laboratorio</span>
          </button>
        </nav>

        {/* Right Tools: Settings, Instrumentarium modal & Progress summary */}
        <div className="studio-actions">
          <button
            onClick={() => setShowSettingsModal(true)}
            aria-label="Impostazioni"
            className="btn-playful px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-black flex items-center gap-1.5 border border-amber-300"
            title="Impostazioni, Accessibilità (Caratteri LIM, Tolleranza, MIDI)"
          >
            <SettingsIcon className="w-4 h-4 text-amber-800" />
            <span className="studio-action-label">Impostazioni</span>
          </button>

          <button
            onClick={() => setShowInstrumentarium(true)}
            aria-label="Strumentario Orff"
            title="Strumentario Orff"
            className="btn-playful px-3 py-1.5 bg-sky-100 hover:bg-sky-200 text-sky-900 text-xs font-black flex items-center gap-1.5 border border-sky-300"
          >
            <Volume2 className="w-4 h-4 text-sky-700" />
            <span className="studio-action-label">Strumentario</span>
          </button>

          <button
            onClick={() => setShowLevelSelector(true)}
            aria-label={`Elenco livelli, ${stats.completedLevels} di 88 completati`}
            title="Elenco livelli"
            className="btn-playful px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-black flex items-center gap-1.5 border border-amber-300"
          >
            <Award className="w-4 h-4 text-amber-600" />
            <span className="studio-action-label">{stats.completedLevels}/88</span>
          </button>
        </div>
      </header>

      {/* ----------------- SUB-NAVBAR FOR CURRICULUM LEVEL CONTROLS ----------------- */}
      {appMode === 'curriculum' && (
        <div className="studio-lesson-nav bg-amber-50/90 border-b border-amber-200">
          {/* Level Switcher (Prev / Level Title / Next) */}
          <div className="studio-level-switch">
            <button
              onClick={handlePrevLevel}
              disabled={!hasPrev}
              className={`p-1.5 rounded-xl border transition-all ${
                hasPrev
                  ? 'bg-white hover:bg-amber-100 text-slate-700 border-amber-200'
                  : 'opacity-40 cursor-not-allowed text-slate-300 border-transparent'
              }`}
              title="Livello precedente"
              aria-label="Livello precedente"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={() => setShowLevelSelector(true)}
              className="studio-level-picker flex items-center gap-2 bg-white hover:bg-amber-100 rounded-xl border border-amber-200 text-xs font-black transition-colors"
            >
              <span
                className={`px-1.5 py-0.5 rounded text-[11px] ${
                  currentLevel.section === 'rhythm'
                    ? 'bg-sky-100 text-sky-800'
                    : 'bg-purple-100 text-purple-800'
                }`}
              >
                {currentLevel.id}
              </span>
              <span className="text-slate-800">{currentLevel.title}</span>
              <span className="text-slate-400">▾</span>
            </button>

            <button
              onClick={handleNextLevel}
              disabled={!hasNext}
              className={`px-3 py-1 rounded-xl border transition-all flex items-center gap-1.5 font-black text-xs ${
                hasNext
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-600 shadow-sm'
                  : 'opacity-40 cursor-not-allowed text-slate-300 border-transparent bg-slate-100'
              }`}
              title="Passa al prossimo livello"
              aria-label="Prossimo livello"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Level Sub-Mode Tabs (Editor vs Rhythm Tap vs Dictation) */}
          <nav className="studio-activities" aria-label="Attività del livello">
            <button
              onClick={() => setSubMode('editor')}
              aria-pressed={subMode === 'editor'}
              className={`px-3 py-1 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                subMode === 'editor'
                  ? 'bg-white text-amber-900 border border-amber-300 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Partitura</span>
            </button>

            <button
              onClick={() => setSubMode('tap')}
              aria-pressed={subMode === 'tap'}
              className={`px-3 py-1 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                subMode === 'tap'
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span className="nav-long">Esegui il Ritmo</span><span className="nav-short">Esegui</span>
            </button>

            {currentLevel.type === 'dictation' && (
              <button
                onClick={() => setSubMode('dictation')}
                aria-pressed={subMode === 'dictation'}
                className={`px-3 py-1 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                  subMode === 'dictation'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Music className="w-3.5 h-3.5" />
                <span>Dettato</span>
              </button>
            )}
          </nav>
        </div>
      )}

      {/* ----------------- MAIN VIEWPORT ----------------- */}
      <main className="studio-main" key={`${appMode}:${showLevelSelector}:${currentLevelId}:${subMode}`}>
        {showLevelSelector ? (
          <LevelSelector
            currentLevelId={currentLevelId}
            onSelectLevel={(id) => {
              setCurrentLevelId(id);
              setShowLevelSelector(false);
            }}
            onClose={() => setShowLevelSelector(false)}
          />
        ) : appMode === 'sandbox' ? (
          // Free sandbox DAW mode (supports both Rhythmic Tablature and Melodic notation)
          <GridEditor
            key="sandbox"
            initialNotes={sandboxNotes}
            levelConfig={SANDBOX}
            onNotesChange={setSandboxNotes}
          />
        ) : subMode === 'tap' ? (
          // Rhythm Tap Game mode
          <RhythmTapGame
            key={currentLevel.id}
            level={currentLevel}
            onComplete={(res) => {
              handleLevelComplete({ ...res, autoAdvance: false });
            }}
            onNextLevel={hasNext ? handleNextLevel : null}
            onBackToEditor={() => setSubMode('editor')}
          />
        ) : subMode === 'dictation' ? (
          // Ear training Dictation game mode
          <DictationGame
            key={currentLevel.id}
            level={currentLevel}
            onComplete={(res) => {
              handleLevelComplete({ ...res, autoAdvance: false });
            }}
            onNextLevel={hasNext ? handleNextLevel : null}
            onBack={() => setSubMode('editor')}
          />
        ) : (
          // Default Workspace Editor mode
          <GridEditor
            key={currentLevel.id}
            initialNotes={userScoreNotes}
            levelConfig={currentLevel}
            onNotesChange={(newNotes) => setUserScoreNotes(newNotes)}
            onNextLevel={hasNext ? handleNextLevel : null}
          />
        )}
      </main>

      {/* Orff & Body Percussion Modal */}
      <InstrumentariumModal
        isOpen={showInstrumentarium}
        onClose={() => setShowInstrumentarium(false)}
      />

      {/* Settings & Accessibility Modal */}
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />

      {/* Aggiornamento automatico (solo versione impacchettata) */}
      {showUpdateModal && (
        <UpdateModal onClose={() => setShowUpdateModal(false)} />
      )}
    </div>
  );
}
