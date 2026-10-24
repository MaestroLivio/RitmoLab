/**
 * MidiManager.js - Web MIDI API Integration for External MIDI Keyboards
 * Connects physical electronic pianos / USB MIDI keyboards to RitmoLab.
 */

// MIDI Note number to Solfege & Scientific Pitch
export const MIDI_NOTE_MAP = {
  // Octave 3
  48: { pitch: 'C3', solfege: 'DO', label: 'Do³' },
  50: { pitch: 'D3', solfege: 'RE', label: 'Re³' },
  52: { pitch: 'E3', solfege: 'MI', label: 'Mi³' },
  53: { pitch: 'F3', solfege: 'FA', label: 'Fa³' },
  55: { pitch: 'G3', solfege: 'SOL', label: 'Sol³' },
  57: { pitch: 'A3', solfege: 'LA', label: 'La³' },
  59: { pitch: 'B3', solfege: 'SI', label: 'Si³' },

  // Octave 4 (Middle C)
  60: { pitch: 'C4', solfege: 'DO', label: 'Do' },
  61: { pitch: 'C#4', solfege: 'DO', label: 'Do♯', accidental: 1 },
  62: { pitch: 'D4', solfege: 'RE', label: 'Re' },
  63: { pitch: 'D#4', solfege: 'RE', label: 'Re♯', accidental: 1 },
  64: { pitch: 'E4', solfege: 'MI', label: 'Mi' },
  65: { pitch: 'F4', solfege: 'FA', label: 'Fa' },
  66: { pitch: 'F#4', solfege: 'FA', label: 'Fa♯', accidental: 1 },
  67: { pitch: 'G4', solfege: 'SOL', label: 'Sol' },
  68: { pitch: 'G#4', solfege: 'SOL', label: 'Sol♯', accidental: 1 },
  69: { pitch: 'A4', solfege: 'LA', label: 'La' },
  70: { pitch: 'A#4', solfege: 'SI', label: 'Si♭', accidental: -1 },
  71: { pitch: 'B4', solfege: 'SI', label: 'Si' },

  // Octave 5
  72: { pitch: 'C5', solfege: 'DO_HIGH', label: 'Do²' },
  74: { pitch: 'D5', solfege: 'RE', label: 'Re²' },
  76: { pitch: 'E5', solfege: 'MI', label: 'Mi²' },
  77: { pitch: 'F5', solfege: 'FA', label: 'Fa²' },
  79: { pitch: 'G5', solfege: 'SOL', label: 'Sol²' },
};

export class MidiManager {
  constructor() {
    this.midiAccess = null;
    this.connectedDevices = [];
    this.noteListeners = new Set();
    this.statusListeners = new Set();
    this.isSupported = typeof navigator !== 'undefined' && !!navigator.requestMIDIAccess;
    this.initMidi();
  }

  async initMidi() {
    if (!this.isSupported) {
      console.info('Web MIDI API not supported in this browser environment.');
      return;
    }

    try {
      this.midiAccess = await navigator.requestMIDIAccess({ sysex: false });
      this.scanInputs();
      this.midiAccess.onstatechange = () => {
        this.scanInputs();
      };
    } catch (err) {
      console.warn('MIDI access request rejected or not available:', err);
    }
  }

  scanInputs() {
    if (!this.midiAccess) return;

    this.connectedDevices = [];
    const inputs = this.midiAccess.inputs.values();

    for (const input of inputs) {
      this.connectedDevices.push({
        id: input.id,
        name: input.name || 'Dispositivo MIDI USB',
        manufacturer: input.manufacturer || 'Generico',
        state: input.state,
      });

      input.onmidimessage = (event) => this.handleMidiMessage(event);
    }

    this.notifyStatus();
  }

  handleMidiMessage(event) {
    const [status, noteNumber, velocity] = event.data;
    const command = status >> 4;

    // Command 9 = Note On (velocity > 0), Command 8 = Note Off
    if (command === 9 && velocity > 0) {
      const mapped = MIDI_NOTE_MAP[noteNumber] || {
        pitch: 'C4',
        solfege: 'DO',
        label: `Nota ${noteNumber}`,
      };

      const noteEvent = {
        midiNote: noteNumber,
        velocity: velocity / 127.0,
        pitch: mapped.pitch,
        solfege: mapped.solfege,
        label: mapped.label,
        accidental: mapped.accidental || 0,
        timestamp: performance.now(),
      };

      this.noteListeners.forEach((listener) => {
        try {
          listener(noteEvent);
        } catch (e) {
          console.error('Error in MIDI note listener:', e);
        }
      });
    }
  }

  onNote(callback) {
    this.noteListeners.add(callback);
    return () => this.noteListeners.delete(callback);
  }

  onStatusChange(callback) {
    this.statusListeners.add(callback);
    return () => this.statusListeners.delete(callback);
  }

  notifyStatus() {
    this.statusListeners.forEach((cb) => {
      try {
        cb(this.connectedDevices);
      } catch (e) {
        console.error('Error in MIDI status listener:', e);
      }
    });
  }

  getConnectedDevices() {
    return this.connectedDevices;
  }
}

export const midiManager = new MidiManager();
