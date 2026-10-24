import React, { useState } from 'react';
import {
  X,
  Save,
  FolderOpen,
  Trash2,
  Download,
  Upload,
  Music,
  Activity,
  Clock,
  Check,
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';
import { levelManager } from '../engine/LevelManager';

export default function ProjectManagerModal({
  isOpen,
  onClose,
  currentProjectData = null, // { notes, bpm, timeSignature, sandboxMode, sandboxStaff, sandboxBars }
  onLoadProject = null, // callback({ notes, bpm, timeSignature, sandboxMode, sandboxStaff, sandboxBars })
}) {
  const [activeTab, setActiveTab] = useState('save'); // 'save' | 'list'
  const [projectTitle, setProjectTitle] = useState('');
  const [savedProjects, setSavedProjects] = useState(() => levelManager.getSavedProjects());
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  if (!isOpen) return null;

  const refreshList = () => {
    setSavedProjects(levelManager.getSavedProjects());
  };

  const handleSave = () => {
    const title = projectTitle.trim() || `Partitura ${savedProjects.length + 1}`;
    levelManager.saveProject({
      title,
      notes: currentProjectData?.notes || [],
      bpm: currentProjectData?.bpm || 90,
      timeSignature: currentProjectData?.timeSignature || '4/4',
      sandboxMode: currentProjectData?.sandboxMode || 'rhythm',
      sandboxStaff: currentProjectData?.sandboxStaff || 'pentagram',
      sandboxBars: currentProjectData?.sandboxBars || 4,
    });

    refreshList();
    setSaveSuccessMsg(`"${title}" salvato con successo!`);
    setTimeout(() => setSaveSuccessMsg(''), 2500);
  };

  const handleLoad = (proj) => {
    if (onLoadProject) {
      onLoadProject(proj);
    }
    onClose();
  };

  const handleDelete = (projId, e) => {
    e.stopPropagation();
    if (window.confirm('Vuoi eliminare questa partitura salvata?')) {
      levelManager.deleteProject(projId);
      refreshList();
    }
  };

  const handleExportProjectJSON = (proj, e) => {
    e.stopPropagation();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(proj, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${proj.title.replace(/[^a-z0-9_-]/gi, '_')}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJSON = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (parsed && parsed.notes) {
          levelManager.saveProject(parsed);
          refreshList();
          setActiveTab('list');
        } else {
          alert('Il file non contiene un formato valido di partitura RitmoLab.');
        }
      } catch (err) {
        alert('Errore nella lettura del file JSON: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 bg-black/45 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none">
      <div className="bg-white rounded-3xl p-6 max-w-xl w-full shadow-2xl border-2 border-amber-200 overflow-hidden flex flex-col max-h-[90vh] animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b-2 border-amber-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 flex items-center justify-center text-amber-950 text-xl font-black shadow-xs">
              📂
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800">Partiture e Progetti Liberi</h3>
              <p className="text-xs text-slate-500">
                Salva, organizza ed esporta le tue creazioni musicali senza limiti.
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

        {/* Tab switcher */}
        <div className="flex items-center gap-2 pt-4 pb-2">
          <button
            onClick={() => setActiveTab('save')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'save'
                ? 'bg-amber-400 text-amber-950 shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Save className="w-3.5 h-3.5" />
            <span>Salva Creazione Corrente</span>
          </button>

          <button
            onClick={() => {
              refreshList();
              setActiveTab('list');
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'list'
                ? 'bg-amber-400 text-amber-950 shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span>I Miei Brani ({savedProjects.length})</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto py-3 space-y-4">
          {activeTab === 'save' ? (
            <div className="space-y-4">
              {/* Current Score Summary */}
              <div className="p-3.5 bg-amber-50/70 rounded-2xl border border-amber-200 text-xs space-y-1.5">
                <span className="font-black text-amber-900 uppercase tracking-wider block">
                  Dettagli della partitura aperta:
                </span>
                <div className="grid grid-cols-2 gap-2 text-slate-700 font-bold">
                  <div>
                    Modalità:{' '}
                    <span className="text-amber-950 font-black">
                      {currentProjectData?.sandboxMode === 'rhythm' ? '🥁 Tablatura Ritmica' : '🎼 Notazione Melodica'}
                    </span>
                  </div>
                  <div>
                    Tempo / Metro:{' '}
                    <span className="text-amber-950 font-black">
                      {currentProjectData?.timeSignature || '4/4'}
                    </span>
                  </div>
                  <div>
                    Numero di Battute:{' '}
                    <span className="text-amber-950 font-black">
                      {currentProjectData?.sandboxBars || 4} battute
                    </span>
                  </div>
                  <div>
                    Totale Note Inserite:{' '}
                    <span className="text-amber-950 font-black">
                      {currentProjectData?.notes?.length || 0} note
                    </span>
                  </div>
                </div>
              </div>

              {/* Title Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700">
                  Titolo della partitura:
                </label>
                <input
                  type="text"
                  placeholder="Es: Il Ballo degli Scoiattoli, Ritmo con i Piedi..."
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl border-2 border-amber-200 focus:border-amber-400 focus:outline-none text-sm font-bold text-slate-800 placeholder:text-slate-400"
                />
              </div>

              {saveSuccessMsg && (
                <div className="p-3 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-xl text-xs font-bold flex items-center gap-2 animate-bounce">
                  <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>{saveSuccessMsg}</span>
                </div>
              )}

              <button
                onClick={handleSave}
                className="btn-playful w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-black flex items-center justify-center gap-2 shadow-emerald-200"
              >
                <Save className="w-4 h-4" />
                <span>Conferma e Salva</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Import from JSON bar */}
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-xs font-bold text-slate-600">Hai un file JSON sul computer?</span>
                <label className="btn-playful px-3 py-1 bg-white hover:bg-slate-100 text-slate-700 text-xs font-black flex items-center gap-1.5 border border-slate-300 cursor-pointer">
                  <Upload className="w-3.5 h-3.5 text-sky-600" />
                  <span>Importa JSON</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportJSON}
                    className="hidden"
                  />
                </label>
              </div>

              {savedProjects.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs font-bold">
                  Nessuna partitura salvata finora. Clicca su "Salva Creazione Corrente" per creare la prima!
                </div>
              ) : (
                savedProjects.map((proj) => (
                  <div
                    key={proj.id}
                    onClick={() => handleLoad(proj)}
                    className="p-3 rounded-2xl border border-amber-200 hover:border-amber-400 bg-amber-50/40 hover:bg-amber-50 cursor-pointer transition-all flex items-center justify-between group shadow-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="text-sm font-black text-slate-800 flex items-center gap-1.5">
                        <span>{proj.sandboxMode === 'rhythm' ? '🥁' : '🎵'}</span>
                        <span className="group-hover:text-amber-900">{proj.title}</span>
                      </div>
                      <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-2">
                        <span>{proj.sandboxBars || 4} battute ({proj.timeSignature || '4/4'})</span>
                        <span>•</span>
                        <span>{proj.notes?.length || 0} note</span>
                        <span>•</span>
                        <span>{new Date(proj.updatedAt || proj.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => handleExportProjectJSON(proj, e)}
                        className="p-2 rounded-xl text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-colors"
                        title="Esporta su file JSON"
                      >
                        <Download className="w-4 h-4" />
                      </button>

                      <button
                        onClick={(e) => handleDelete(proj.id, e)}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Elimina partitura"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <span className="btn-playful ml-1 px-3 py-1 bg-amber-400 text-amber-950 text-xs font-black rounded-xl">
                        Carica
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
