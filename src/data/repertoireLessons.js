import { REPERTOIRE } from './repertoire.js';
import { getMeter, toMidi } from '../engine/Transport.js';

const rhythmSongs = [
  'twinkle twinkle twinkle twinkle bahia peixe epo twinkle',
  'bahia bahia cai peixe epo hei cai peixe',
  'bahia cai peixe bahia cai hei peixe bahia',
  'epo hei bahia cai peixe epo',
  'hei epo cai bahia peixe epo',
  'cai bahia peixe hei peixe cai',
  'bahia peixe epo',
  'twinkle bahia peixe',
].join(' ').split(' ');

const melodySongs = [
  'rain rain rain twinkle twinkle rain rain rain',
  'twinkle hot twinkle epo hei hot epo twinkle',
  'twinkle twinkle bahia peixe cai twinkle bahia peixe',
  'epo cai bahia fra fra fra peixe cai',
  'peixe twinkle bahia peixe twinkle peixe peixe peixe',
].join(' ').split(' ');

// Start and end (exclusive) in the source score. Omitted exercises use a
// preparatory response, with the original reading and coordination objectives.
const melodyPhrases = {
  4: [16, 32], 9: [0, 16], 10: [0, 16], 11: [0, 32], 12: [0, 32],
  14: [0, 16], 15: [0, 128], 17: [0, 16], 18: [32, 48],
  20: [64, 88], 21: [0, 24], 22: [0, 192], 23: [32, 48],
  25: [0, 32], 26: [0, 32], 27: [0, 32], 28: [0, 32], 29: [0, 64], 30: [0, 128],
  31: [8, 24], 32: [0, 32],
  33: [8, 32], 36: [64, 104], 39: [0, Infinity], 40: [0, 64],
};

// Direct quotations of the sung rhythm where the original values fit the
// lesson. Earlier or denser passages use an ostinato alongside the song.
const rhythmPhrases = {
  12: [8, 24], 13: [80, 96], 16: [8, 24], 37: [64, 72], 43: [8, 24], 48: [0, Infinity],
};

const melodyLessonNames = [
  'Eco Sol–Mi', 'Durate nell’eco', 'Arriva il La', 'La–Sol', 'La frase e la risposta', 'Eco in ottavi',
  'Segni delle mani', 'Scrivi sul bigramma', 'Arriva il Do', 'Arriva il Re', 'Frase pentatonica',
  'Prima frase del canto', 'Gioco di risposta', 'Riconosci e ripeti', 'Canta con il testo',
  'Costruisci una risposta', 'Sul pentagramma', 'Mi e Fa naturali', 'Il Si naturale', 'Do acuto',
  'In levare', 'Melodia completa', 'Riconosci l’inciso', 'Costruisci la risposta', 'Do tenuto',
  'Bordone Do–Sol', 'Canto e ostinato', 'Entrare a canone', 'Prima metà del canone', 'Canone completo',
  'Due parti in ascolto', 'Scrivi la seconda voce', 'Fraseggio', 'Mi–Fa', 'Si–Do', 'Verso il Do acuto',
  'Completa la frase', 'Dettato di cadenza', 'Canto e Orff', 'Composizione a due voci',
];

const expression = {
  p: { label: 'p · piano', hint: 'Suona o canta piano, con un suono chiaro.', velocity: 50 },
  mf: { label: 'mf · mezzoforte', hint: 'Suona o canta con intensità media.', velocity: 77 },
  f: { label: 'f · forte', hint: 'Aumenta l’intensità senza accelerare.', velocity: 105 },
  cresc: { label: 'cresc. · crescendo', hint: 'Aumenta gradualmente l’intensità fino al forte.', velocity: 77 },
  dim: { label: 'dim. · diminuendo', hint: 'Diminuisci gradualmente l’intensità fino al piano.', velocity: 77 },
};

function repeatNotes(notes, phraseSteps, totalSteps, prefix) {
  return Array.from({ length: Math.ceil(totalSteps / phraseSteps) }, (_, cycle) => notes
    .filter(note => note.step + cycle * phraseSteps < totalSteps)
    .map((note, index) => {
      const step = note.step + cycle * phraseSteps;
      return { ...note, id: `${prefix}-${cycle}-${index}`, step,
        duration: Math.min(note.duration, totalSteps - step) };
    })).flat();
}

function chordSection(chords, first, last) {
  const current = chords.findLast(chord => chord.step <= first);
  return [{ ...current, step: 0 }, ...chords.filter(chord => chord.step > first && chord.step < last)
    .map(chord => ({ ...chord, step: chord.step - first }))];
}

function repeatChords(chords, length, totalSteps) {
  return repeatNotes(chords.map(chord => ({ ...chord, duration: 1 })), length, totalSteps, 'chord')
    .filter((chord, index, events) => index === 0 || chord.symbol !== events[index - 1].symbol);
}

const instrumentPairs = [
  ['clap', 'claves', 39, 75], ['feet', 'kick', 35, 36], ['thighs', 'tambourine', 63, 54],
  ['snap', 'triangle', 37, 81], ['chest', 'cymbals', 64, 49],
];

export function arrangementNotes(notes, mode) {
  return (notes || []).map(note => {
    if (note.pitch || !note.sound) return note;
    const pair = instrumentPairs.find(([body, orff]) => note.sound === body || note.sound === orff);
    if (!pair) return note;
    const [body, orff, bodyMidi, orffMidi] = pair;
    const sound = mode === 'orff' ? orff : body;
    return { ...note, sound, rowId: sound, midi: note.isRest ? undefined : mode === 'orff' ? orffMidi : bodyMidi };
  });
}

export function levelArrangement(level, mode) {
  if (level.section !== 'rhythm') return level;
  const orff = mode === 'orff';
  return { ...level, rhythmMode: mode,
    targetNotes: arrangementNotes(level.targetNotes, mode),
    targetNotesTrack2: level.targetNotesTrack2 && arrangementNotes(level.targetNotesTrack2, mode),
    explanation: orff ? { ...level.explanation,
      howToCount: 'Conta come nella versione Body Percussion. Segui le righe degli strumenti e mantieni gli stessi attacchi e pause.',
      hint: 'Suona con le bacchette o con le mani, secondo lo strumento. Alterna piano e forte senza cambiare il tempo.',
    } : level.explanation,
  };
}

export function repertoireLesson(level) {
  const rhythm = level.section === 'rhythm';
  const number = Number(level.id.slice(1));
  const song = REPERTOIRE[(rhythm ? rhythmSongs : melodySongs)[number - 1]];
  const phrase = !rhythm && melodyPhrases[number];
  const rhythmicQuote = rhythm && rhythmPhrases[number];
  const [first, last] = phrase || rhythmicQuote || [0, song.totalSteps];
  const timeSignature = phrase || rhythmicQuote ? song.timeSignature : level.timeSignature;
  const barSteps = getMeter(timeSignature).barSteps;
  const sourceSteps = Math.min(last, song.totalSteps) - first;
  const phraseSteps = phrase || rhythmicQuote ? sourceSteps : level.totalSteps;
  const totalSteps = Math.ceil(Math.max(barSteps * 4, phraseSteps, level.totalSteps + barSteps) / phraseSteps)
    * phraseSteps;
  const goal = !rhythm && number >= 33 ? [
    'Ripeti l’inciso prima piano, poi forte, mantenendo il tempo.',
    'Intona Mi–Fa e Fa–Mi, ascoltando il semitono naturale.',
    'Intona Si–Do e Do–Si, senza cambiare armatura.',
    'Prepara la salita al Do acuto e canta la frase con il suo ritmo puntato.',
    'Completa la frase scegliendo Mi o Fa naturali.',
    'Riconosci la variante che conclude sul Do.',
    'Canta il brano completo mentre una seconda parte accompagna.',
    'Componi una risposta di almeno otto battute con due parti in Do maggiore.',
  ][number - 33] : phrase ? `Esegui l’inciso indicato di ${song.title}. Ascolta il modello, poi ripeti seguendo le note del rigo.`
    : level.explanation.goal;
  const originalNotes = level.targetNotes.map(note => {
    const pitch = note.accidental ? ({ FA: number === 34 || number === 37 ? 'MI' : 'FA' }[note.pitch] || note.pitch) : note.pitch;
    return { ...note, pitch, accidental: 0, rowId: pitch || note.rowId, midi: pitch && toMidi(pitch) };
  });
  if (!rhythm && number === 34) {
    ['MI', 'FA', 'MI', 'FA'].forEach((pitch, index) => {
      originalNotes[index] = { ...originalNotes[index], pitch, rowId: pitch, midi: toMidi(pitch) };
    });
  }
  if (!rhythm && number === 35) {
    ['SI', 'DO_HIGH', 'SI', 'DO_HIGH'].forEach((pitch, index) => {
      originalNotes[index] = { ...originalNotes[index], pitch, rowId: pitch, midi: toMidi(pitch) };
    });
  }
  if (!rhythm && number === 38) {
    const lastNote = originalNotes.at(-1);
    Object.assign(lastNote, { pitch: 'DO', rowId: 'DO', midi: 60 });
  }

  const source = song.notes.filter(note => note.step >= first && note.step < last)
    .map(note => ({ ...note, step: note.step - first }));
  let motif = phrase ? source : originalNotes;
  if (rhythmicQuote) {
    // Keep the quarter/eighth comparison in the reconstruction and dettato.
    const mergeFirstPair = [12, 16, 43].includes(number);
    motif = source.flatMap((note, index) => {
      if (mergeFirstPair && index === 1) return [];
      const sound = number === 48 ? ['clap', 'thighs', 'feet'][index % 3] : 'clap';
      return [{ ...note, duration: mergeFirstPair && index === 0 ? 4 : note.duration,
        lyric: undefined, pitch: undefined, sound, rowId: sound }];
    });
  }
  const duration = rhythm && number === 48 ? sourceSteps : totalSteps;
  const chords = repeatChords(phrase || rhythm ? chordSection(song.chords, first, last)
    : song.chords.slice(0, 1).map(chord => ({ ...chord, symbol: 'C', midi: [60, 64, 67] })),
  phrase || rhythm ? sourceSteps : phraseSteps, duration);
  const guide = rhythm ? repeatNotes(source, sourceSteps, duration, 'guide') : [];
  const secondTrack = !rhythm && number >= 28 && number <= 30
    ? repeatNotes(source, sourceSteps, duration, 'canon').filter(note => note.step + 16 < duration)
      .map(note => ({ ...note, step: note.step + 16, duration: Math.min(note.duration, duration - note.step - 16) }))
    : (!rhythm && [31, 32, 39, 40].includes(number)) || rhythm && number === 48
      ? chords.map((chord, index) => ({ id: `bass-${index}`, step: chord.step, duration: 4,
        pitch: { C: 'DO', F: 'FA', G7: 'SOL' }[chord.symbol] || 'DO', instrument: 'xylophone', velocity: 60 }))
      : level.targetNotesTrack2 && repeatNotes(level.targetNotesTrack2, level.totalSteps, duration, 'companion');
  const midpoint = Math.floor(duration / (getMeter(timeSignature).barSteps * 2)) * getMeter(timeSignature).barSteps;
  const expressive = rhythm ? number >= 17 : number >= 25;
  const dynamics = (expressive
    ? [[0, 'p'], [Math.floor(midpoint / 2), 'cresc'], [midpoint, 'f'], [Math.floor(midpoint * 1.5), 'dim']]
    : [[0, 'p'], [midpoint, number < 9 ? 'f' : 'mf']])
    .map(([step, mark]) => ({ step, mark, ...expression[mark] }));
  const velocityAt = step => {
    const index = dynamics.findLastIndex(event => event.step <= step);
    const current = dynamics[index];
    if (current.mark !== 'cresc' && current.mark !== 'dim') return current.velocity;
    const end = dynamics[index + 1]?.step ?? duration;
    const [from, to] = current.mark === 'cresc' ? [50, 105] : [105, 50];
    return Math.round(from + (to - from) * (step - current.step) / Math.max(1, end - current.step));
  };
  const targetNotes = repeatNotes(motif, phraseSteps, duration, 'target')
    .map(note => ({ ...note, velocity: velocityAt(note.step), rowId: note.rowId || note.pitch || note.sound }));
  return {
    ...level, song, totalSteps: duration, timeSignature, chords, dynamics, guide,
    staffType: !rhythm && number === 39 ? 'dual' : level.staffType,
    relatedSong: level.id === 'M30' ? REPERTOIRE.row : null,
    bars: Math.ceil(duration / getMeter(timeSignature).barSteps), accidentalsEnabled: false,
    title: `${song.title} · ${rhythm ? level.title : melodyLessonNames[number - 1]}`,
    description: goal,
    explanation: phrase || !rhythm && number >= 33 ? { goal, howToCount: 'Segui la pulsazione e i segni di dinamica.' }
      : { ...level.explanation, goal },
    options: !rhythm && number === 38 ? [
      { id: 'optA', label: 'La frase si chiude sul Do', isCorrect: true },
      { id: 'optB', label: 'La frase resta sospesa su un’altra nota', isCorrect: false },
    ] : level.options,
    targetNotes: rhythm ? arrangementNotes(targetNotes, 'body') : targetNotes,
    targetNotesTrack2: secondTrack?.map(note => ({ ...note, rowId: note.pitch || note.rowId,
      midi: note.pitch ? toMidi(note.pitch) : undefined, velocity: note.velocity || 62 })),
  };
}
