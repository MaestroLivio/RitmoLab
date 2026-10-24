import React, { useState } from 'react';
import { Volume2, Play, CheckCircle2, XCircle, RotateCcw, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import { audioEngine } from '../engine/AudioEngine';

export default function DictationGame({
  level,
  onComplete = null,
  onNextLevel = null,
  onBack = null,
}) {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [selectedOptionId, setSelectedOptionId] = useState(null);
  const [evaluated, setEvaluated] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const handleListen = () => {
    setIsPlayingAudio(true);
    audioEngine.setBpm(level.bpm || 80);
    const score = {
      bpm: level.bpm || 80,
      totalSteps: level.totalSteps || 16,
      playMetronome: true,
      tracks: [
        {
          notes: level.targetNotes || [],
        }
      ]
    };

    audioEngine.startScorePlayback(
      score,
      null,
      () => setIsPlayingAudio(false)
    );
  };

  const handleSelectOption = (opt) => {
    if (evaluated) return;
    setSelectedOptionId(opt.id);
  };

  const handleVerify = () => {
    if (!selectedOptionId) return;
    const chosen = level.options?.find(o => o.id === selectedOptionId);
    const correct = chosen?.isCorrect;
    setIsCorrect(correct);
    setEvaluated(true);

    if (correct) {
      audioEngine.playSuccessFanfare();
      confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
      if (onComplete) {
        onComplete({ levelId: level.id, stars: 3, accuracy: 100 });
      }
    } else {
      audioEngine.playFeedbackSound('missed');
    }
  };

  const handleRetry = () => {
    setSelectedOptionId(null);
    setEvaluated(false);
    setIsCorrect(false);
  };

  return (
    <div className="flex flex-col h-full bg-montessori-cream rounded-3xl border-2 border-amber-200/90 shadow-playful p-6 overflow-hidden select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b-2 border-amber-100">
        <div>
          <span className="text-xs font-black text-purple-800 uppercase tracking-wider bg-purple-100 px-2.5 py-1 rounded-full">
            Dettato e Ascolto Musicale
          </span>
          <h2 className="text-2xl font-black text-slate-800 mt-1">{level.title}</h2>
          <p className="text-xs text-slate-600 mt-0.5">{level.description}</p>
        </div>

        {onBack && (
          <button
            onClick={onBack}
            className="btn-playful px-4 py-2 bg-white text-slate-700 border border-amber-200 text-xs hover:bg-amber-50"
          >
            Torna all'Editor
          </button>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-xl mx-auto w-full py-4">
        {/* Didactic Explanation Box */}
        <div className="w-full bg-white/90 p-4 rounded-2xl border border-purple-200 shadow-playful-sm mb-5 text-xs space-y-1.5">
          <div>
            <span className="font-black text-purple-900 block">🎯 Obiettivo dell'Esercizio:</span>
            <span className="text-slate-700 font-medium">
              {level.explanation?.goal || level.description}
            </span>
          </div>
          {level.explanation?.hint && (
            <div>
              <span className="font-black text-purple-900 block">💡 Suggerimento d'Ascolto:</span>
              <span className="text-slate-700 font-medium">
                {level.explanation.hint}
              </span>
            </div>
          )}
        </div>

        {/* Audio Player Button */}
        <div className="mb-6 text-center">
          <button
            onClick={handleListen}
            disabled={isPlayingAudio}
            className={`btn-playful px-8 py-5 rounded-3xl text-white text-lg font-black flex items-center gap-3 shadow-playful mx-auto ${
              isPlayingAudio
                ? 'bg-amber-500 animate-pulse'
                : 'bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 shadow-purple-200'
            }`}
          >
            <Volume2 className="w-7 h-7" />
            <span>{isPlayingAudio ? 'In Riproduzione...' : 'Ascolta il Ritmo'}</span>
          </button>
          <span className="text-xs text-slate-500 font-semibold block mt-2">
            Puoi ascoltare quante volte vuoi prima di rispondere!
          </span>
        </div>

        {/* Multiple Choice Options */}
        <div className="w-full space-y-3 mb-6">
          {level.options?.map((opt) => {
            const isSelected = selectedOptionId === opt.id;
            let borderStyle = 'border-amber-200 bg-white hover:border-purple-300';

            if (evaluated) {
              if (opt.isCorrect) {
                borderStyle = 'border-emerald-500 bg-emerald-50 text-emerald-900';
              } else if (isSelected && !opt.isCorrect) {
                borderStyle = 'border-rose-400 bg-rose-50 text-rose-900';
              }
            } else if (isSelected) {
              borderStyle = 'border-purple-500 bg-purple-50 text-purple-950 ring-2 ring-purple-300';
            }

            return (
              <div
                key={opt.id}
                onClick={() => handleSelectOption(opt)}
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between shadow-playful-sm ${borderStyle}`}
              >
                <span className="text-sm font-black">{opt.label}</span>
                {evaluated && opt.isCorrect && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                )}
                {evaluated && isSelected && !opt.isCorrect && (
                  <XCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
                )}
              </div>
            );
          })}
        </div>

        {/* Action button */}
        {!evaluated ? (
          <button
            onClick={handleVerify}
            disabled={!selectedOptionId}
            className={`btn-playful w-full py-3.5 text-sm font-black rounded-2xl ${
              selectedOptionId
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-200'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            Verifica Risposta
          </button>
        ) : (
          <div className="w-full flex items-center gap-3">
            <button
              onClick={handleRetry}
              className="btn-playful flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Riprova</span>
            </button>

            {isCorrect && (onComplete || onNextLevel) && (
              <button
                onClick={() => {
                  if (onComplete) {
                    onComplete({ levelId: level.id, stars: 3, accuracy: 100 });
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
        )}
      </div>
    </div>
  );
}
