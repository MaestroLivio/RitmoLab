import React from 'react';
import { Volume2, X } from 'lucide-react';
import { audioEngine } from '../engine/AudioEngine';
import { SOUND_COLORS } from './NoteRenderer';

export default function InstrumentariumModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const bodyPercussionList = [
    { id: 'clap', name: 'Mani (Clap)', desc: 'Rumore bianco passa-banda. Suono acuto e festoso.', color: '#38BDF8', icon: '👏' },
    { id: 'snap', name: 'Dita (Snap)', desc: 'Click acuto e percussivo. Richiede precisione e leggerezza.', color: '#C084FC', icon: '🫰' },
    { id: 'chest', name: 'Petto (Chest)', desc: 'Sine sweep discendente a bassa frequenza. Rassicurante e profondo.', color: '#FB7185', icon: '🫀' },
    { id: 'thighs', name: 'Cosce (Thighs)', desc: 'Sine sweep medio con tocco slap su tessuto.', color: '#FBBF24', icon: '🦵' },
    { id: 'feet', name: 'Piedi (Feet)', desc: 'Kick drum profondo. La base ritmica a terra.', color: '#34D399', icon: '🦶' },
  ];

  const orffInstruments = [
    { id: 'claves', name: 'Legnetti (Claves)', desc: 'Doppio oscillatore risonante su frequenze lignee (2200-2780 Hz).', color: '#D97706', icon: '🥢' },
    { id: 'tambourine', name: 'Tamburello', desc: 'Risuonatore a membrana unito allo scampanellio dei piattini metallici.', color: '#F472B6', icon: '🪘' },
    { id: 'triangle', name: 'Triangolo', desc: '4 oscillatori metallici disarmonici ad alto Q con lungo decadimento lucente.', color: '#FDE047', icon: '📐' },
    { id: 'cymbals', name: 'Piatti (Cymbals)', desc: 'Rumore passa-alto filtrato con inviluppo esponenziale prolungato.', color: '#22D3EE', icon: '🪙' },
  ];

  const playSound = (id) => {
    audioEngine.playSoundByName(id);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 max-w-2xl w-full shadow-2xl border-2 border-amber-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-amber-100">
          <div>
            <h3 className="text-xl font-black text-slate-800">
              Strumentario Orff & Body Percussion
            </h3>
            <p className="text-xs text-slate-500">
              Sintesi procedurale Web Audio API pura senza campioni audio esterni.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 space-y-6">
          {/* Body Percussion */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-sky-800 mb-2">
              Body Percussion (Il Corpo come Strumento)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {bodyPercussionList.map((item) => (
                <div
                  key={item.id}
                  onClick={() => playSound(item.id)}
                  className="p-3 rounded-2xl border-2 border-amber-100 hover:border-amber-300 bg-amber-50/40 hover:bg-amber-100/60 cursor-pointer transition-all flex items-center gap-3 group"
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shadow-playful-sm flex-shrink-0"
                    style={{ backgroundColor: item.color }}
                  >
                    {item.icon}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <span className="text-sm font-black text-slate-800 group-hover:text-amber-900 block truncate">
                      {item.name}
                    </span>
                    <span className="text-[11px] text-slate-500 line-clamp-1">
                      {item.desc}
                    </span>
                  </div>
                  <Volume2 className="w-4 h-4 text-slate-300 group-hover:text-amber-700 flex-shrink-0" />
                </div>
              ))}
            </div>
          </div>

          {/* Orff Instruments */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-amber-800 mb-2">
              Strumentario Didattico Orff
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {orffInstruments.map((item) => (
                <div
                  key={item.id}
                  onClick={() => playSound(item.id)}
                  className="p-3 rounded-2xl border-2 border-amber-100 hover:border-amber-300 bg-amber-50/40 hover:bg-amber-100/60 cursor-pointer transition-all flex items-center gap-3 group"
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shadow-playful-sm flex-shrink-0"
                    style={{ backgroundColor: item.color }}
                  >
                    {item.icon}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <span className="text-sm font-black text-slate-800 group-hover:text-amber-900 block truncate">
                      {item.name}
                    </span>
                    <span className="text-[11px] text-slate-500 line-clamp-1">
                      {item.desc}
                    </span>
                  </div>
                  <Volume2 className="w-4 h-4 text-slate-300 group-hover:text-amber-700 flex-shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-amber-100 text-center">
          <button
            onClick={onClose}
            className="btn-playful px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
}
