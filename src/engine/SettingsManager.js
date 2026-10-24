/**
 * SettingsManager.js - Centralized Settings and Preferences Store
 * Handles persistence, font-size scaling, timing tolerance, MIDI state, and audio preferences.
 */

const SETTINGS_STORAGE_KEY = 'ritmolab_settings_v1';

export const TIMING_TOLERANCES = {
  generous: {
    label: 'Molto Ampia (Ideale per Bambini / Scuola Primaria)',
    description: 'Tolleranza rilassata: premia ogni tentativo incoraggiando l\'alunno.',
    perfectMs: 240, // ±240ms for Perfetto
    goodMs: 380,    // ±380ms for Impreciso/Buono
  },
  medium: {
    label: 'Media / Bilanciata',
    description: 'Tolleranza moderata per alunni che hanno già preso confidenza con il metronomo.',
    perfectMs: 160,
    goodMs: 260,
  },
  strict: {
    label: 'Accurata / Standard',
    description: 'Tolleranza per verificare la precisione ritmica avanzata.',
    perfectMs: 90,
    goodMs: 170,
  },
};

export const FONT_SIZES = {
  normal: { label: 'Normale (100%)', scaleClass: 'scale-100', zoom: 1.0 },
  large: { label: 'Grande (115%) - Consigliata per Alunni', scaleClass: 'scale-105', zoom: 1.15 },
  xlarge: { label: 'Molto Grande (130%) - LIM e Accessibilità', scaleClass: 'scale-110', zoom: 1.3 },
};

export const DEFAULT_ENABLED_INSTRUMENTS = {
  // Body Percussion
  clap: true,      // Mani
  feet: true,      // Piedi
  thighs: true,    // Cosce
  chest: true,     // Petto
  snap: true,      // Dita
  // Strumentario Orff & Melodici
  claves: true,     // Legnetti
  tambourine: true, // Tamburello
  triangle: true,   // Triangolo
  cymbals: true,    // Piatti
  xylophone: true,  // Xilofono
  flute: true,      // Flauto
};

export class SettingsManager {
  constructor() {
    this.listeners = new Set();
    this.settings = {
      fontSize: 'large', // default to large for primary school readability
      timingTolerance: 'generous', // default to generous tolerance as requested!
      forceTrebleClef: false, // if true, shows Pentagramma in Chiave di Sol in melodic levels
      showKodalySigns: true, // visible Kodaly hand signs
      continuousLoop: false, // continuous score loop repetition
      masterVolume: 0.85,
      metronomeVolume: 0.7,
      melodicInstrument: 'xylophone',
      midiEnabled: true,
      midiDeviceName: null,
      showKeyboardShortcuts: true,
      enabledInstruments: { ...DEFAULT_ENABLED_INSTRUMENTS },
    };
    this.loadSettings();
    this.applyRootFontSize();
  }

  isInstrumentEnabled(instrumentId) {
    if (!this.settings.enabledInstruments) return true;
    const key = (instrumentId || '').toLowerCase();
    return this.settings.enabledInstruments[key] !== false;
  }

  toggleInstrument(instrumentId) {
    const key = (instrumentId || '').toLowerCase();
    const current = this.isInstrumentEnabled(key);
    const updated = {
      ...this.settings.enabledInstruments,
      [key]: !current,
    };
    this.set('enabledInstruments', updated);
  }

  loadSettings() {
    try {
      if (typeof localStorage === 'undefined') return;
      const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        this.settings = { ...this.settings, ...parsed };
      }
    } catch (e) {
      console.warn('Could not load settings:', e);
    }
  }

  saveSettings() {
    try {
      if (typeof localStorage === 'undefined') return;
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(this.settings));
      this.applyRootFontSize();
      this.notify();
    } catch (e) {
      console.error('Could not save settings:', e);
    }
  }

  get(key) {
    return this.settings[key];
  }

  getAll() {
    return { ...this.settings };
  }

  set(key, value) {
    this.settings[key] = value;
    this.saveSettings();
  }

  update(partial) {
    this.settings = { ...this.settings, ...partial };
    this.saveSettings();
  }

  getToleranceValues() {
    const mode = this.settings.timingTolerance || 'generous';
    return TIMING_TOLERANCES[mode] || TIMING_TOLERANCES.generous;
  }

  applyRootFontSize() {
    if (typeof document === 'undefined') return;
    const fontConfig = FONT_SIZES[this.settings.fontSize] || FONT_SIZES.large;
    document.documentElement.style.fontSize = `${fontConfig.zoom * 16}px`;
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notify() {
    this.listeners.forEach((cb) => {
      try {
        cb(this.settings);
      } catch (e) {
        console.error('Error in settings listener:', e);
      }
    });
  }
}

export const settingsManager = new SettingsManager();
