import React, { useState } from 'react';
import {
  BookOpen,
  Volume2,
  Square,
  Sparkles,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Eye,
  CheckCircle,
  Music,
  Headphones,
  ArrowRight
} from 'lucide-react';

export default function DidacticExplanationCard({
  level,
  onPlayTarget,
  onStopTarget,
  isPlayingTarget = false,
  onShowSolutionOnGrid = null,
  isSolutionVisibleOnGrid = false,
  onNextLevel = null,
}) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!level) return null;

  const explanation = level.explanation || {
    goal: level.description,
    howToCount: level.section === 'rhythm'
      ? 'Conta a voce alta i quarti: 1 - 2 - 3 - 4 (Ta, Ta, Ta, Ta)'
      : 'Canta le note con le sillabe Kodály (Do, Re, Mi, Fa, Sol, La, Si)',
    hint: 'Ascolta prima la versione corretta per memorizzare il ritmo e l\'altezza delle note.'
  };

  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-3xl p-4 shadow-playful-sm mb-3 transition-all select-none">
      {/* Top Bar: Title, badges, and toggle */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-8 h-8 rounded-xl bg-amber-400 flex items-center justify-center text-amber-950 font-black text-sm shadow-xs flex-shrink-0">
            📖
          </div>
          <div className="overflow-hidden">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-md">
                Spiegazione Didattica
              </span>
              <span className="text-xs font-bold text-slate-500 truncate">
                {level.areaTitle}
              </span>
            </div>
            <h3 className="text-sm font-black text-slate-800 truncate">
              {level.id}: {level.title}
            </h3>
          </div>
        </div>

        {/* Action: Listen to Correct Version button & Collapse Toggle */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={isPlayingTarget ? onStopTarget : onPlayTarget}
            className={`btn-playful px-3.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all text-white shadow-sm ${
              isPlayingTarget
                ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-200 animate-pulse'
                : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200'
            }`}
            title="Ascolta la versione corretta di questo esercizio"
          >
            {isPlayingTarget ? (
              <>
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Ferma Esempio</span>
              </>
            ) : (
              <>
                <Headphones className="w-3.5 h-3.5" />
                <span>Ascolta Versione Corretta</span>
              </>
            )}
          </button>

          {onShowSolutionOnGrid && (
            <button
              onClick={onShowSolutionOnGrid}
              className={`btn-playful px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 border transition-colors ${
                isSolutionVisibleOnGrid
                  ? 'bg-purple-100 text-purple-900 border-purple-300'
                  : 'bg-white text-slate-700 border-amber-200 hover:bg-amber-100'
              }`}
              title="Carica la partitura modello sulla griglia come guida"
            >
              <Eye className="w-3.5 h-3.5 text-purple-600" />
              <span className="hidden md:inline">
                {isSolutionVisibleOnGrid ? 'Nascondi Guida' : 'Guida Soluzione'}
              </span>
            </button>
          )}

          {onNextLevel && (
            <button
              onClick={onNextLevel}
              className="btn-playful px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 bg-amber-400 hover:bg-amber-500 text-amber-950 shadow-sm"
              title="Passa direttamente al prossimo livello"
            >
              <span>Prossimo Livello</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-white/80 transition-colors"
            title={isExpanded ? 'Riduci spiegazione' : 'Espandi spiegazione'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-amber-200/80 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          {/* Card 1: Pedagogical Goal */}
          <div className="bg-white/90 p-3 rounded-2xl border border-amber-100 shadow-xs flex flex-col justify-between">
            <div>
              <div className="text-[11px] font-black text-amber-900 uppercase tracking-wider mb-1 flex items-center gap-1">
                <span>🎯</span>
                <span>Obiettivo dell'Esercizio</span>
              </div>
              <p className="text-slate-700 font-medium leading-relaxed">
                {explanation.goal}
              </p>
            </div>
          </div>

          {/* Card 2: Vocal Counting Guide (Kodály Method) */}
          <div className="bg-white/90 p-3 rounded-2xl border border-amber-100 shadow-xs flex flex-col justify-between">
            <div>
              <div className="text-[11px] font-black text-amber-900 uppercase tracking-wider mb-1 flex items-center gap-1">
                <span>🗣️</span>
                <span>Guida Vocale (Come Contare)</span>
              </div>
              <p className="text-slate-700 font-medium leading-relaxed">
                {explanation.howToCount}
              </p>
            </div>
            <div className="mt-1 text-[10px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-md inline-block">
              Metodo Kodály (Solfeggio Relativo)
            </div>
          </div>

          {/* Card 3: Action & Practical Hint */}
          <div className="bg-white/90 p-3 rounded-2xl border border-amber-100 shadow-xs flex flex-col justify-between">
            <div>
              <div className="text-[11px] font-black text-amber-900 uppercase tracking-wider mb-1 flex items-center gap-1">
                <span>💡</span>
                <span>Suggerimento Pratico</span>
              </div>
              <p className="text-slate-700 font-medium leading-relaxed">
                {explanation.hint}
              </p>
            </div>
            <div className="mt-1 text-[10px] text-emerald-700 font-bold flex items-center gap-1">
              <span>🎧 Clicca su "Ascolta Versione Corretta" per memorizzare il suono!</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
