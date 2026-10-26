import React, { useState, useEffect } from 'react';
import { Download, X, RefreshCw, CheckCircle2, AlertTriangle, ExternalLink } from 'lucide-react';

/**
 * UpdateModal — Notifica di aggiornamento automatico.
 *
 * All'avvio, la versione impacchettata (Electron) interroga GitHub per una
 * nuova release. Se disponibile, mostra questo dialogo; su conferma scarica
 * l'installer e lo avvia. Nella versione web/HTML (ChromeOS) l'API
 * `window.ritmoLabAPI` non esiste, quindi il componente non viene montato.
 */

export default function UpdateModal({ onClose }) {
  const [info, setInfo] = useState(null);
  const [phase, setPhase] = useState('checking'); // checking | available | downloading | done | error
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    let unsubscribe = null;

    async function run() {
      const api = window.ritmoLabAPI;
      if (!api || !api.updates) return; // non impacchettato

      unsubscribe = api.updates.onProgress((p) => {
        if (!cancelled && p && typeof p.percent === 'number') {
          setProgress(p.percent);
        }
      });

      try {
        const result = await api.updates.check();
        if (cancelled) return;
        if (result) {
          setInfo(result);
          setPhase('available');
        } else {
          onClose(); // nessun aggiornamento: chiudi silenziosamente
        }
      } catch (err) {
        if (!cancelled) onClose();
      }
    }

    run();
    return () => {
      cancelled = true;
      if (unsubscribe) unsubscribe();
    };
  }, [onClose]);

  async function handleInstall() {
    setPhase('downloading');
    setError('');
    try {
      const api = window.ritmoLabAPI;
      const result = await api.updates.install();
      if (result && result.ok) {
        setPhase('done');
      } else {
        setError((result && result.error) || 'Impossibile completare il download.');
        setPhase('error');
      }
    } catch (err) {
      setError((err && err.message) || 'Impossibile completare il download.');
      setPhase('error');
    }
  }

  // Stato iniziale di verifica: mostra un piccolo spinner.
  if (phase === 'checking') {
    return (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 shadow-2xl border-2 border-amber-200 flex items-center gap-3 animate-fade-in">
          <RefreshCw className="w-5 h-5 text-amber-500 animate-spin" />
          <span className="text-sm font-bold text-slate-700">Verifica aggiornamenti…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/45 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border-2 border-amber-200 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b-2 border-amber-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 flex items-center justify-center text-amber-950 text-xl font-black shadow-xs">
              {phase === 'done' ? '✅' : '🆕'}
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-800">
                {phase === 'done' ? 'Aggiornamento pronto' : 'Nuova versione disponibile'}
              </h3>
              <p className="text-xs text-slate-500">RitmoLab</p>
            </div>
          </div>
          {phase !== 'downloading' && (
            <button
              onClick={onClose}
              className="p-2 rounded-2xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="py-4 space-y-4">
          {phase === 'available' && info && (
            <>
              <div className="bg-amber-50 rounded-2xl border border-amber-200 p-4 text-center">
                <div className="text-sm font-bold text-slate-700">
                  È disponibile la versione{' '}
                  <span className="text-emerald-600 font-black">{info.latestVersion}</span>
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Versione installata: {info.currentVersion}
                </div>
              </div>
              <p className="text-xs text-slate-600">
                Vuoi scaricare e installare l'aggiornamento? Al termine del download verrà
                avviato l'installer e RitmoLab si chiuderà.
              </p>
            </>
          )}

          {phase === 'downloading' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                <Download className="w-4 h-4 text-amber-600" />
                Scaricamento dell'aggiornamento…
              </div>
              <div className="w-full h-4 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-emerald-500 transition-all duration-300"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
              <div className="text-center text-xs font-black text-slate-600">
                {progress > 0 ? `${progress}%` : 'Inizio…'}
              </div>
            </div>
          )}

          {phase === 'done' && (
            <div className="text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
              <p className="text-sm font-bold text-slate-700">
                Download completato! L'installer si sta avviando.
              </p>
              <p className="text-xs text-slate-500">
                RitmoLab si chiuderà tra un istante. Segui le istruzioni dell'installer per
                completare l'aggiornamento.
              </p>
            </div>
          )}

          {phase === 'error' && (
            <div className="text-center space-y-3">
              <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto" />
              <p className="text-sm font-bold text-slate-700">Aggiornamento non riuscito</p>
              <p className="text-xs text-slate-500">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t-2 border-amber-100 flex items-center justify-end gap-2">
          {phase === 'available' && (
            <>
              <button
                onClick={onClose}
                className="btn-playful px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black rounded-2xl"
              >
                Più tardi
              </button>
              <button
                onClick={handleInstall}
                className="btn-playful px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black rounded-2xl flex items-center gap-1.5 shadow-emerald-200"
              >
                <Download className="w-4 h-4" />
                Aggiorna ora
              </button>
            </>
          )}

          {phase === 'downloading' && (
            <button
              disabled
              className="btn-playful px-5 py-2.5 bg-slate-200 text-slate-400 text-xs font-black rounded-2xl cursor-not-allowed"
            >
              Scaricamento in corso…
            </button>
          )}

          {(phase === 'done' || phase === 'error') && (
            <button
              onClick={onClose}
              className="btn-playful px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black rounded-2xl"
            >
              Chiudi
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
