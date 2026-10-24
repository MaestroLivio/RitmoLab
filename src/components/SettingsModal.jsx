import React, { useState, useEffect } from 'react';
import {
  X,
  Type,
  Clock,
  Music,
  Volume2,
  Sliders,
  Check,
  CheckCircle2,
  AlertCircle,
  Keyboard,
  Sparkles,
  Repeat
} from 'lucide-react';
import { settingsManager, FONT_SIZES, TIMING_TOLERANCES } from '../engine/SettingsManager';
import { midiManager } from '../engine/MidiManager';
import KodalyHandSign, { KODALY_SIGNS_DATA } from './KodalyHandSign';

export default function SettingsModal({ isOpen, onClose }) {
  const [settings, setSettings] = useState(settingsManager.getAll());
  const [midiDevices, setMidiDevices] = useState(midiManager.getConnectedDevices());

  useEffect(() => {
    const unsubSettings = settingsManager.subscribe((newSettings) => {
      setSettings(newSettings);
    });

    const unsubMidi = midiManager.onStatusChange((devices) => {
      setMidiDevices(devices);
    });

    return () => {
      unsubSettings();
      unsubMidi();
    };
  }, []);

  if (!isOpen) return null;

  const handleUpdate = (key, value) => {
    settingsManager.set(key, value);
    setSettings(settingsManager.getAll());
  };

  return (
    <div className="fixed inset-0 bg-black/45 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 max-w-2xl w-full shadow-2xl border-2 border-amber-200 overflow-hidden flex flex-col max-h-[92vh] animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b-2 border-amber-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 flex items-center justify-center text-amber-950 text-xl font-black shadow-xs">
              ⚙️
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800">Impostazioni & Accessibilità</h3>
              <p className="text-xs text-slate-500">
                Personalizza l'esperienza per la classe, la LIM e gli allievi.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-2xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Settings Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-5 pr-1">
          {/* 1. Grandezza dei Caratteri (Font Size Scaling) */}
          <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200">
            <div className="flex items-center gap-2 mb-2">
              <Type className="w-4 h-4 text-amber-700" />
              <h4 className="text-sm font-black text-slate-800">Grandezza dei Caratteri (Testo & Note)</h4>
            </div>
            <p className="text-xs text-slate-600 mb-3">
              Ingrandisce i testi, i bottoni e i controlli per facilitare la lettura agli alunni o durante la proiezione su LIM.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {Object.entries(FONT_SIZES).map(([key, config]) => {
                const isSelected = settings.fontSize === key;
                return (
                  <button
                    key={key}
                    onClick={() => handleUpdate('fontSize', key)}
                    className={`btn-playful p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                      isSelected
                        ? 'bg-amber-400 text-amber-950 border-amber-500 shadow-playful-sm'
                        : 'bg-white text-slate-700 border-amber-200 hover:bg-amber-100/60'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-black">{config.label.split('-')[0]}</div>
                      <div className="text-[10px] opacity-75">{config.label.split('-')[1] || ''}</div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-amber-950 font-black" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Tolleranza Errore di Tempo (Timing Tolerance) */}
          <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-amber-700" />
              <h4 className="text-sm font-black text-slate-800">Tolleranza Errore di Tempo (Esercizi Tap)</h4>
            </div>
            <p className="text-xs text-slate-600 mb-3">
              Regola la severità della valutazione del tempo nella modalità "Esegui il Ritmo" e "Tap Melodico".
            </p>

            <div className="space-y-2">
              {Object.entries(TIMING_TOLERANCES).map(([key, config]) => {
                const isSelected = settings.timingTolerance === key;
                return (
                  <div
                    key={key}
                    onClick={() => handleUpdate('timingTolerance', key)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-emerald-50 text-emerald-950 border-emerald-400 shadow-xs'
                        : 'bg-white text-slate-700 border-amber-200 hover:bg-amber-50'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-black flex items-center gap-2">
                        <span>{config.label}</span>
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                          ±{config.perfectMs}ms
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{config.description}</div>
                    </div>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. Modalità Pentagramma in Chiave di Sol */}
          <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200 flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Music className="w-4 h-4 text-purple-700" />
                <h4 className="text-sm font-black text-slate-800">Pentagramma in Chiave di Sol</h4>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Consente di visualizzare sempre il Pentagramma standard a 5 linee con Chiave di Violino (Sol) anche nei livelli iniziali su Bigramma o Trigramma.
              </p>
            </div>
            <button
              onClick={() => handleUpdate('forceTrebleClef', !settings.forceTrebleClef)}
              className={`w-14 h-8 rounded-full transition-colors relative p-1 flex-shrink-0 ${
                settings.forceTrebleClef ? 'bg-purple-600' : 'bg-slate-300'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full bg-white transition-transform transform shadow-sm ${
                  settings.forceTrebleClef ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* 4. Segni Kodaly (Chironomia) */}
          <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200 flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base">🖐️</span>
                <h4 className="text-sm font-black text-slate-800">Mostra Gesti Kodály sulle Note</h4>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Mostra le illustrazioni vettoriali dei segni delle mani (Do, Re, Mi, Fa, Sol, La, Si) sulle note e sui tasti musicali.
              </p>
            </div>
            <button
              onClick={() => handleUpdate('showKodalySigns', !settings.showKodalySigns)}
              className={`w-14 h-8 rounded-full transition-colors relative p-1 flex-shrink-0 ${
                settings.showKodalySigns ? 'bg-purple-600' : 'bg-slate-300'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full bg-white transition-transform transform shadow-sm ${
                  settings.showKodalySigns ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* 5. Ripetizione Continua delle Partiture (Loop) */}
          <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200 flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Repeat className="w-4 h-4 text-rose-600" />
                <h4 className="text-sm font-black text-slate-800">Ripetizione Continua Partiture (Loop)</h4>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Mantiene la riproduzione musicale (sia dell'allievo che degli esempi modello) in loop continuo finché non si preme Stop.
              </p>
            </div>
            <button
              onClick={() => handleUpdate('continuousLoop', !settings.continuousLoop)}
              className={`w-14 h-8 rounded-full transition-colors relative p-1 flex-shrink-0 ${
                settings.continuousLoop ? 'bg-rose-500' : 'bg-slate-300'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full bg-white transition-transform transform shadow-sm ${
                  settings.continuousLoop ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* 6. Abilitazione Strumenti e Parti del Corpo (Body Percussion) */}
          <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base">🥁</span>
              <h4 className="text-sm font-black text-slate-800">Strumenti e Parti del Corpo Abilitati</h4>
            </div>
            <p className="text-xs text-slate-600 mb-3">
              Abilita o disabilita specifici strumenti o azioni di Body Percussion per adattare gli esercizi e l'editor alle esigenze della classe.
            </p>

            <div className="mb-3">
              <span className="text-[11px] font-black text-amber-900 uppercase tracking-wider block mb-1.5">
                🖐️ Body Percussion (Parti del Corpo):
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[
                  { id: 'clap', label: 'Mani', icon: '👏' },
                  { id: 'feet', label: 'Piedi', icon: '🦶' },
                  { id: 'thighs', label: 'Cosce', icon: '🦵' },
                  { id: 'chest', label: 'Petto', icon: '🫀' },
                  { id: 'snap', label: 'Dita', icon: '🫰' },
                ].map((item) => {
                  const isEnabled = settings.enabledInstruments?.[item.id] !== false;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        settingsManager.toggleInstrument(item.id);
                        setSettings(settingsManager.getAll());
                      }}
                      className={`btn-playful p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                        isEnabled
                          ? 'bg-white border-amber-300 text-slate-800 shadow-2xs hover:bg-amber-50'
                          : 'bg-slate-100 border-slate-200 text-slate-400 opacity-60'
                      }`}
                    >
                      <span className="text-xl">{item.icon}</span>
                      <span className="text-xs font-bold">{item.label}</span>
                      <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${
                        isEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-500'
                      }`}>
                        {isEnabled ? 'Attivo' : 'Escluso'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <span className="text-[11px] font-black text-amber-900 uppercase tracking-wider block mb-1.5">
                🎼 Strumentario Orff & Melodici:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { id: 'claves', label: 'Legnetti (Claves)', icon: '🥢' },
                  { id: 'tambourine', label: 'Tamburello', icon: '🪘' },
                  { id: 'triangle', label: 'Triangolo', icon: '📐' },
                  { id: 'cymbals', label: 'Piatti', icon: '🥁' },
                  { id: 'xylophone', label: 'Xilofono', icon: '🪵' },
                  { id: 'flute', label: 'Flauto', icon: '🪈' },
                ].map((item) => {
                  const isEnabled = settings.enabledInstruments?.[item.id] !== false;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        settingsManager.toggleInstrument(item.id);
                        setSettings(settingsManager.getAll());
                      }}
                      className={`btn-playful p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-all cursor-pointer ${
                        isEnabled
                          ? 'bg-white border-amber-300 text-slate-800 shadow-2xs hover:bg-amber-50'
                          : 'bg-slate-100 border-slate-200 text-slate-400 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{item.icon}</span>
                        <span className="text-xs font-bold">{item.label}</span>
                      </div>
                      <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                        isEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-500'
                      }`}>
                        {isEnabled ? '✓' : '✗'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 7. Connessione MIDI USB & Tastiera Computer */}
          <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200">
            <div className="flex items-center gap-2 mb-2">
              <Keyboard className="w-4 h-4 text-sky-700" />
              <h4 className="text-sm font-black text-slate-800">Tastiera MIDI USB & Computer</h4>
            </div>

            {/* MIDI Status Box */}
            <div className="p-3 bg-white rounded-xl border border-amber-200 mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">🎹</span>
                <div>
                  <div className="text-xs font-black text-slate-800">
                    {midiDevices.length > 0
                      ? `Tastiera MIDI Collegata: ${midiDevices[0].name}`
                      : 'Nessun dispositivo MIDI USB rilevato al momento'}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {midiDevices.length > 0
                      ? 'Pronta per suonare nella modalità tap melodica!'
                      : 'Collega qualsiasi pianoforte digitale o tastiera MIDI USB al computer.'}
                  </div>
                </div>
              </div>
              <span
                className={`w-3 h-3 rounded-full flex-shrink-0 ${
                  midiDevices.length > 0 ? 'bg-emerald-500 animate-ping' : 'bg-slate-300'
                }`}
              />
            </div>

            {/* PC Keyboard Shortcut Preview */}
            <div className="text-[11px] text-slate-600">
              <span className="font-bold text-slate-800">Mappatura Tasti Computer (Modalità Melodica):</span>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 mt-1.5 text-center">
                {Object.entries(KODALY_SIGNS_DATA).map(([key, data]) => (
                  <div key={key} className="p-1 rounded-lg border border-slate-200 bg-white shadow-2xs">
                    <div className="font-black text-xs" style={{ color: data.color }}>
                      {data.syllable}
                    </div>
                    <kbd className="text-[10px] font-bold bg-slate-100 px-1 py-0.5 rounded border border-slate-300 block mt-0.5">
                      {data.keyboardKey}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t-2 border-amber-100 flex items-center justify-end">
          <button
            onClick={onClose}
            className="btn-playful px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black rounded-2xl shadow-emerald-200"
          >
            Salva e Chiudi
          </button>
        </div>
      </div>
    </div>
  );
}
