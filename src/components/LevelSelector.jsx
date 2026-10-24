import React, { useState } from 'react';
import {
  Star,
  Lock,
  CheckCircle,
  Play,
  Trophy,
  Download,
  Upload,
  RotateCcw,
  Sparkles,
  ChevronRight,
  Music,
  Activity,
  Award
} from 'lucide-react';
import { levelManager } from '../engine/LevelManager';

export default function LevelSelector({
  currentLevelId,
  onSelectLevel,
  onClose = null,
}) {
  const [activeTab, setActiveTab] = useState('rhythm'); // 'rhythm' | 'melody'
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');

  const rhythmicLevels = levelManager.getRhythmicLevels();
  const melodicLevels = levelManager.getMelodicLevels();
  const stats = levelManager.getOverallStatistics();

  const currentList = activeTab === 'rhythm' ? rhythmicLevels : melodicLevels;

  // Group levels by areaNumber
  const groupedAreas = React.useMemo(() => {
    const map = new Map();
    currentList.forEach(lvl => {
      const key = `${lvl.areaNumber}_${lvl.areaTitle}`;
      if (!map.has(key)) {
        map.set(key, {
          areaNumber: lvl.areaNumber,
          areaTitle: lvl.areaTitle,
          levels: []
        });
      }
      map.get(key).levels.push(lvl);
    });
    return Array.from(map.values());
  }, [currentList]);

  const handleExport = () => {
    const jsonStr = levelManager.exportDataAsJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ritmolab_progress_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    if (!importJsonText.trim()) return;
    const ok = levelManager.importDataFromJSON(importJsonText);
    if (ok) {
      alert('Progressi importati con successo!');
      setShowTeacherModal(false);
      setImportJsonText('');
    } else {
      alert('Formato JSON non valido.');
    }
  };

  return (
    <div className="flex flex-col h-full bg-montessori-cream rounded-3xl border-2 border-amber-200/90 shadow-playful overflow-hidden select-none">
      {/* Top Header & Global Stats */}
      <div className="px-6 py-5 bg-white border-b-2 border-amber-100 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Percorso Didattico</h1>
            <span className="text-xs font-black bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full">
              88 Livelli Totali
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Dal battito del cuore alla grande sinfonia a due voci.
          </p>
        </div>

        {/* Stats Pill */}
        <div className="flex items-center gap-4 bg-amber-50 px-4 py-2 rounded-2xl border border-amber-200">
          <div className="flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-bold text-slate-600">Completati:</span>
            <span className="text-sm font-black text-amber-900">{stats.completedLevels}/88</span>
          </div>

          <div className="h-4 w-[1px] bg-amber-200" />

          <div className="flex items-center gap-1.5">
            <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
            <span className="text-xs font-bold text-slate-600">Stelle:</span>
            <span className="text-sm font-black text-amber-900">{stats.totalStarsEarned}</span>
          </div>

          <div className="h-4 w-[1px] bg-amber-200" />

          <button
            onClick={() => setShowTeacherModal(true)}
            className="text-xs font-bold text-purple-700 hover:text-purple-900 underline"
          >
            Strumenti Docente
          </button>
        </div>
      </div>

      {/* Tabs: Ritmo (48) vs Melodia (40) */}
      <div className="flex items-center px-6 pt-3 bg-white/70 border-b border-amber-200 gap-3">
        <button
          onClick={() => setActiveTab('rhythm')}
          className={`pb-3 px-4 font-black text-sm flex items-center gap-2 border-b-4 transition-all ${
            activeTab === 'rhythm'
              ? 'border-sky-500 text-sky-900'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Parte A: Ritmo & Body Percussion</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-sky-100 text-sky-800">48</span>
        </button>

        <button
          onClick={() => setActiveTab('melody')}
          className={`pb-3 px-4 font-black text-sm flex items-center gap-2 border-b-4 transition-all ${
            activeTab === 'melody'
              ? 'border-purple-500 text-purple-900'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          <Music className="w-4 h-4" />
          <span>Parte B: Melodia & Solmisazione</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">40</span>
        </button>
      </div>

      {/* Level List / Grouped Areas */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {groupedAreas.map((group) => (
          <div key={group.areaNumber} className="space-y-3">
            {/* Area Header */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400 bg-slate-200 px-2 py-0.5 rounded-md">
                Area {group.areaNumber}
              </span>
              <h3 className="text-base font-black text-slate-800">{group.areaTitle}</h3>
            </div>

            {/* Grid of Level Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {group.levels.map((lvl) => {
                const status = levelManager.getLevelStatus(lvl.id);
                const isCurrent = currentLevelId === lvl.id;
                const isUnlocked = status.unlocked;

                return (
                  <div
                    key={lvl.id}
                    onClick={() => {
                      if (isUnlocked) onSelectLevel(lvl.id);
                    }}
                    className={`card-playful p-3.5 flex flex-col justify-between transition-all ${
                      isCurrent
                        ? 'ring-4 ring-amber-400 ring-offset-2 scale-[1.02] border-amber-400 bg-amber-50/50'
                        : isUnlocked
                        ? 'hover:scale-[1.02] cursor-pointer hover:border-amber-300'
                        : 'opacity-55 cursor-not-allowed bg-slate-50'
                    }`}
                  >
                    <div>
                      {/* Top row: ID badge & Stars */}
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className={`text-xs font-black px-2 py-0.5 rounded-lg ${
                            lvl.section === 'rhythm'
                              ? 'bg-sky-100 text-sky-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}
                        >
                          {lvl.id}
                        </span>

                        {isUnlocked ? (
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3].map((starIdx) => (
                              <Star
                                key={starIdx}
                                className={`w-3.5 h-3.5 ${
                                  starIdx <= status.stars
                                    ? 'text-amber-400 fill-amber-400'
                                    : 'text-slate-200 fill-slate-100'
                                }`}
                              />
                            ))}
                          </div>
                        ) : (
                          <Lock className="w-3.5 h-3.5 text-slate-400" />
                        )}
                      </div>

                      {/* Title & Description */}
                      <h4 className="text-sm font-black text-slate-800 line-clamp-1">{lvl.title}</h4>
                      <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-snug">
                        {lvl.description}
                      </p>
                    </div>

                    {/* Bottom Status */}
                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-400">
                        {lvl.type === 'tap'
                          ? '🥁 Rhythm Tap'
                          : lvl.type === 'dictation'
                          ? '👂 Dettato'
                          : lvl.type === 'compose'
                          ? '✨ Composizione'
                          : '🧩 Costruzione'}
                      </span>

                      {status.completed && (
                        <span className="text-emerald-700 font-bold flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          <span>{status.accuracy}%</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Teacher / Administration Modal */}
      {showTeacherModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border-2 border-amber-200">
            <h3 className="text-lg font-black text-slate-800 mb-2">Strumenti Docente & Salvataggio</h3>
            <p className="text-xs text-slate-600 mb-4">
              Esporta o importa i progressi della classe, oppure sblocca tutti i livelli per testarli liberamente.
            </p>

            <div className="space-y-3 mb-6">
              <button
                onClick={() => {
                  levelManager.unlockAllLevelsForTesting();
                  alert('Tutti gli 88 livelli sono stati sbloccati!');
                  setShowTeacherModal(false);
                }}
                className="btn-playful w-full py-2.5 bg-amber-400 hover:bg-amber-500 text-amber-950 text-xs font-black flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Sblocca Tutti i Livelli (Modalità Test)</span>
              </button>

              <button
                onClick={handleExport}
                className="btn-playful w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Esporta Progressi in JSON</span>
              </button>

              <div className="pt-2">
                <span className="text-xs font-bold text-slate-600 mb-1 block">Importa da JSON:</span>
                <textarea
                  value={importJsonText}
                  onChange={(e) => setImportJsonText(e.target.value)}
                  placeholder="Incolla qui il JSON dei progressi..."
                  rows={3}
                  className="w-full text-xs p-2 border border-slate-300 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-purple-300"
                />
                <button
                  onClick={handleImport}
                  className="btn-playful mt-1.5 w-full py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center justify-center gap-2"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Carica Progressi</span>
                </button>
              </div>

              <button
                onClick={() => {
                  if (confirm('Sei sicuro di voler azzerare tutti i progressi?')) {
                    levelManager.resetProgress();
                    setShowTeacherModal(false);
                  }
                }}
                className="btn-playful w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold flex items-center justify-center gap-2 border border-rose-200"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Azzera Tutti i Progressi</span>
              </button>
            </div>

            <button
              onClick={() => setShowTeacherModal(false)}
              className="w-full py-2 text-xs font-bold text-slate-500 hover:text-slate-800"
            >
              Chiudi
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
