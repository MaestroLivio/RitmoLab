/**
 * curriculum.js - Complete 88-Level Pedagogical Curriculum for RitmoLab
 * 48 Rhythmic & Body Percussion Levels + 40 Melodic & Kodály Solmization Levels.
 * With enriched pedagogical explanations, Kodály vocal counting guides, and target models.
 */

export const FIGURE_DURATIONS = {
  whole: 16,
  half: 8,
  quarter: 4,
  eighth: 2,
  sixteenth: 1,
  rest_quarter: 4,
  rest_eighth: 2,
  rest_half: 8,
  rest_whole: 16,
};

export const FIGURE_INFO = {
  whole: { label: 'Intero 4/4', symbol: '𝅝', beats: 4, duration: 16, category: 'note' },
  half: { label: 'Metà 2/4', symbol: '𝅗𝅥', beats: 2, duration: 8, category: 'note' },
  quarter: { label: 'Quarto 1/4', symbol: '♩', beats: 1, duration: 4, category: 'note' },
  eighth: { label: 'Ottavo 1/8', symbol: '♪', beats: 0.5, duration: 2, category: 'note' },
  sixteenth: { label: 'Sedicesimo 1/16', symbol: '♬', beats: 0.25, duration: 1, category: 'note' },
  rest_quarter: { label: 'Pausa di Quarto 1/4', symbol: '𝄽', beats: 1, duration: 4, isRest: true, category: 'rest' },
  rest_eighth: { label: 'Pausa di Ottavo 1/8', symbol: '𝄾', beats: 0.5, duration: 2, isRest: true, category: 'rest' },
  rest_half: { label: 'Pausa di Metà 2/4', symbol: '𝄼', beats: 2, duration: 8, isRest: true, category: 'rest' },
  rest_whole: { label: 'Pausa di Intero 4/4', symbol: '𝄻', beats: 4, duration: 16, isRest: true, category: 'rest' },
};

// Generate 48 Rhythmic Levels with full didactic explanations
function generateRhythmicCurriculum() {
  const levels = [];

  // AREA 1: Scoprire il ritmo (1-8) - Solo Mani (Clap). Intero 4/4, Metà 2/4, Quarto 1/4.
  const area1Data = [
    {
      title: "Il Battito del Cuore",
      desc: "Suona l'Intero 4/4 (Semibreve) da 4 tempi completi con le mani.",
      notes: [{ step: 0, duration: 16, sound: 'clap' }],
      explanation: {
        goal: "Imparare la figura musicale più lunga del 4/4: l'Intero 4/4. Dura per tutti e 4 i battiti della battuta.",
        howToCount: "Batti le mani sul tempo 1 e tieni le mani unite contando mentalmente: '1 - 2 - 3 - 4' (Sillaba Kodály: 'Ta-a-a-a').",
        hint: "Non staccare le mani subito: senti la durata di tutti e 4 i quarti che riempiono la battuta intera."
      }
    },
    {
      title: "Due Grandi Passi",
      desc: "Due note da 2 tempi (Metà 2/4) che dividono esattamente a metà la battuta.",
      notes: [{ step: 0, duration: 8, sound: 'clap' }, { step: 8, duration: 8, sound: 'clap' }],
      explanation: {
        goal: "Scoprire la Metà 2/4 (Minima): ogni nota dura 2 quarti. Due note da 2 tempi formano una battuta completa di 4/4.",
        howToCount: "Batti sul tempo 1 e sul tempo 3: 'Ta-a' (tempi 1-2), poi 'Ta-a' (tempi 3-4).",
        hint: "Ascolta il metronomo: il primo colpo cade sul battito forte (1), il secondo sul battito medio (3)."
      }
    },
    {
      title: "Quattro Passi Costanti",
      desc: "Quattro note da un quarto (Quarto 1/4) che tengono il tempo come i rintocchi di un orologio.",
      notes: [{ step: 0, duration: 4, sound: 'clap' }, { step: 4, duration: 4, sound: 'clap' }, { step: 8, duration: 4, sound: 'clap' }, { step: 12, duration: 4, sound: 'clap' }],
      explanation: {
        goal: "Eseguire la pulsazione fondamentale della musica: il Quarto 1/4 (Semiminima). C'è un colpo per ciascun battito.",
        howToCount: "Conta a tempo regolare: '1 - 2 - 3 - 4'. Con il metodo Kodály pronuncia: 'Ta - Ta - Ta - Ta'.",
        hint: "Mantieni i colpi di mani sempre alla stessa distanza temporale, seguendo il ticchettio del metronomo."
      }
    },
    {
      title: "Metà e Quarti",
      desc: "Combina una Metà 2/4 (2 tempi) con due Quarti 1/4 (1 tempo ciascuno).",
      notes: [{ step: 0, duration: 8, sound: 'clap' }, { step: 8, duration: 4, sound: 'clap' }, { step: 12, duration: 4, sound: 'clap' }],
      explanation: {
        goal: "Sperimentare l'alternanza tra una nota lunga (Metà 2/4) e due note corte (Quarti 1/4).",
        howToCount: "Pronuncia con ritmo: 'Ta-a' (dura 2 tempi), 'Ta' (tempo 3), 'Ta' (tempo 4).",
        hint: "Il primo colpo di mani si prolunga per 2 tempi, mentre gli ultimi due colpi sono veloci e decisi."
      }
    },
    {
      title: "La Marcia degli Orsetti",
      desc: "Due Quarti 1/4 seguiti da una Metà 2/4 riposante: il passo cadenzato della marcia.",
      notes: [{ step: 0, duration: 4, sound: 'clap' }, { step: 4, duration: 4, sound: 'clap' }, { step: 8, duration: 8, sound: 'clap' }],
      explanation: {
        goal: "Invertire la struttura precedente: prima due note da un quarto, poi la chiusura distesa sulla metà.",
        howToCount: "Canta la filastrocca: 'Ta - Ta - Ta-a' (passo, passo, riposo lungo).",
        hint: "Due passi decisi dell'orsetto e poi un grande salto che dura due tempi interi."
      }
    },
    {
      title: "Il Respiro Lungo",
      desc: "Due battute consecutive: prima i 4 Quarti costanti, poi l'Intero 4/4 rilassante.",
      bars: 2,
      notes: [{ step: 0, duration: 4, sound: 'clap' }, { step: 4, duration: 4, sound: 'clap' }, { step: 8, duration: 4, sound: 'clap' }, { step: 12, duration: 4, sound: 'clap' }, { step: 16, duration: 16, sound: 'clap' }],
      explanation: {
        goal: "Sviluppare la memoria ritmica su 2 battute intere ($8$ tempi totali).",
        howToCount: "Battuta 1: 'Ta - Ta - Ta - Ta' (4 quarti). Battuta 2: 'Ta-a-a-a' (un colpo solo che risuona per 4 tempi).",
        hint: "Non fermarti tra la prima e la seconda battuta: la musica scorre senza interruzioni."
      }
    },
    {
      title: "Alternanza Dolce",
      desc: "Quarto 1/4, Metà 2/4 e Quarto 1/4: una figura simmetrica che culla il ritmo.",
      notes: [{ step: 0, duration: 4, sound: 'clap' }, { step: 4, duration: 8, sound: 'clap' }, { step: 12, duration: 4, sound: 'clap' }],
      explanation: {
        goal: "Riconoscere la simmetria ritmica: 1 quarto + 2 quarti + 1 quarto = 4/4.",
        howToCount: "Pronuncia: 'Ta' (tempo 1), 'Ta-a' (tempi 2-3), 'Ta' (tempo 4).",
        hint: "La nota centrale è una Metà 2/4 e dura il doppio rispetto alle note iniziale e finale."
      }
    },
    {
      title: "Gran Finale dei Fondamentali",
      desc: "Costruisci o suona una battuta completa usando Metà 2/4 e due Quarti 1/4.",
      notes: [{ step: 0, duration: 8, sound: 'clap' }, { step: 8, duration: 4, sound: 'clap' }, { step: 12, duration: 4, sound: 'clap' }],
      explanation: {
        goal: "Verifica e consolidamento delle tre figure fondamentali: Intero 4/4, Metà 2/4 e Quarto 1/4.",
        howToCount: "Conta attentamente il ciclo dei 4 quarti: '1 - 2 - 3 - 4'.",
        hint: "Ascolta la versione corretta per verificare se il tuo ritmo rispetta la quadratura perfetta."
      }
    }
  ];

  area1Data.forEach((lvl, idx) => {
    levels.push({
      id: `R${idx + 1}`,
      globalId: idx + 1,
      section: 'rhythm',
      areaNumber: 1,
      areaTitle: "Area 1: Scoprire il ritmo (Intero 4/4, Metà 2/4, Quarto 1/4)",
      title: lvl.title,
      description: lvl.desc,
      explanation: lvl.explanation,
      type: idx === 7 ? 'build' : 'tap',
      bpm: 75 + (idx * 2),
      timeSignature: '4/4',
      staffType: 'single',
      bars: lvl.bars || 1,
      totalSteps: (lvl.bars || 1) * 16,
      allowedFigures: ['whole', 'half', 'quarter'],
      allowedSounds: ['clap'],
      targetNotes: lvl.notes,
    });
  });

  // AREA 2: Entrano gli ottavi (9-16) - Solo Clap. Ottavo 1/8 (Ti-Ti).
  const area2Data = [
    {
      title: "I Cavallini al Trotto",
      desc: "Introduzione dell'Ottavo 1/8 (Croma): due note per ogni battito (sillaba Ti-Ti).",
      notes: [{ step: 0, duration: 2, sound: 'clap' }, { step: 2, duration: 2, sound: 'clap' }, { step: 4, duration: 4, sound: 'clap' }, { step: 8, duration: 2, sound: 'clap' }, { step: 10, duration: 2, sound: 'clap' }, { step: 12, duration: 4, sound: 'clap' }],
      explanation: {
        goal: "Imparare l'Ottavo 1/8 (Croma): ogni quarto viene suddiviso in 2 note identiche.",
        howToCount: "Sillaba ritmica Kodály: 'Ti-Ti' (due ottavi veloci in un tempo), 'Ta' (un quarto fermo). Quindi: 'Ti-Ti, Ta, Ti-Ti, Ta'.",
        hint: "Pensa al trotto leggero di un cavallino: due colpi agili e poi un passo più disteso."
      }
    },
    {
      title: "Trotteggiare Regolare",
      desc: "Una battuta intera composta esclusivamente da coppie di Ottavi 1/8 (8 colpi ben scanditi).",
      notes: [0, 2, 4, 6, 8, 10, 12, 14].map(s => ({ step: s, duration: 2, sound: 'clap' })),
      explanation: {
        goal: "Eseguire 8 ottavi consecutivi senza perdere la regolarità della pulsazione.",
        howToCount: "Ripeti la cantilena continua: 'Ti-Ti, Ti-Ti, Ti-Ti, Ti-Ti' (4 coppie per 4 quarti totali).",
        hint: "Batti le mani con leggerezza: il movimento deve essere fluido e costante come gocce d'acqua."
      }
    },
    {
      title: "Ta e Ti-Ti a Confronto",
      desc: "Alternanza rigorosa: un Quarto 1/4 (Ta) seguito da due Ottavi 1/8 (Ti-Ti).",
      notes: [{ step: 0, duration: 4, sound: 'clap' }, { step: 4, duration: 2, sound: 'clap' }, { step: 6, duration: 2, sound: 'clap' }, { step: 8, duration: 4, sound: 'clap' }, { step: 12, duration: 2, sound: 'clap' }, { step: 14, duration: 2, sound: 'clap' }],
      explanation: {
        goal: "Sviluppare la capacità di passare istantaneamente dalla velocità 1 alla velocità 2.",
        howToCount: "Pronuncia chiaramente: 'Ta' (lento), 'Ti-Ti' (veloce), 'Ta' (lento), 'Ti-Ti' (veloce).",
        hint: "Ascolta il metronomo: su 'Ta' batti una volta sola; su 'Ti-Ti' batti due volte nello stesso intervallo."
      }
    },
    {
      title: "Il Treno a Vapore",
      desc: "Coppia di Ottavi 1/8 in apertura (partenza rapida), poi Quarti 1/4 regolari.",
      notes: [{ step: 0, duration: 2, sound: 'clap' }, { step: 2, duration: 2, sound: 'clap' }, { step: 4, duration: 4, sound: 'clap' }, { step: 8, duration: 4, sound: 'clap' }, { step: 12, duration: 4, sound: 'clap' }],
      explanation: {
        goal: "Gestire il cambio di velocità all'inizio della battuta.",
        howToCount: "Conta: 'Ti-Ti' (tempo 1), 'Ta' (tempo 2), 'Ta' (tempo 3), 'Ta' (tempo 4).",
        hint: "I due ottavi iniziali danno l'energia per avviare il treno, poi il ritmo si stabilizza sui quarti."
      }
    },
    {
      title: "Saltarello Antico",
      desc: "Un ritmo tradizionale danzante: Quarto 1/4, due Ottavi 1/8 e chiusura in Metà 2/4.",
      notes: [{ step: 0, duration: 4, sound: 'clap' }, { step: 4, duration: 2, sound: 'clap' }, { step: 6, duration: 2, sound: 'clap' }, { step: 8, duration: 8, sound: 'clap' }],
      explanation: {
        goal: "Sintetizzare insieme Quarto 1/4, Ottavo 1/8 e Metà 2/4 in una danza festosa.",
        howToCount: "Pronuncia: 'Ta' (tempo 1), 'Ti-Ti' (tempo 2), 'Ta-a' (tempi 3 e 4).",
        hint: "La chiusura con la Metà 2/4 ti permette di respirare prima della ripetizione."
      }
    },
    {
      title: "Rimbalzi Doppi",
      desc: "Due Ottavi 1/8, un Quarto 1/4, due Ottavi 1/8, un Quarto 1/4.",
      notes: [{ step: 0, duration: 2, sound: 'clap' }, { step: 2, duration: 2, sound: 'clap' }, { step: 4, duration: 4, sound: 'clap' }, { step: 8, duration: 2, sound: 'clap' }, { step: 10, duration: 2, sound: 'clap' }, { step: 12, duration: 4, sound: 'clap' }],
      explanation: {
        goal: "Mantenere il controllo ritmico su due cellule identiche affiancate.",
        howToCount: "Sillabe Kodály: 'Ti-Ti, Ta' seguito subito da un altro 'Ti-Ti, Ta'.",
        hint: "I rimbalzi sono uguali: immagina una palla che rimbalza due volte a terra e poi viene presa al volo."
      }
    },
    {
      title: "La Pioggia Fine",
      desc: "Due battute che mescolano Ottavi 1/8 e Metà 2/4 per creare dinamismo e contrasto.",
      bars: 2,
      notes: [{ step: 0, duration: 2, sound: 'clap' }, { step: 2, duration: 2, sound: 'clap' }, { step: 4, duration: 8, sound: 'clap' }, { step: 12, duration: 4, sound: 'clap' }, { step: 16, duration: 8, sound: 'clap' }, { step: 24, duration: 2, sound: 'clap' }, { step: 26, duration: 2, sound: 'clap' }, { step: 28, duration: 4, sound: 'clap' }],
      explanation: {
        goal: "Sviluppare la memoria e il controllo del tempo lungo due battute con ritmi misti.",
        howToCount: "Battuta 1: 'Ti-Ti, Ta-a, Ta'. Battuta 2: 'Ta-a, Ti-Ti, Ta'.",
        hint: "Ascolta la versione corretta per cogliere come le due battute dialogano tra loro."
      }
    },
    {
      title: "Ricostruisci gli Ottavi",
      desc: "Trascina le note mancanti per completare il ritmo del saltarello.",
      notes: [{ step: 0, duration: 4, sound: 'clap' }, { step: 4, duration: 2, sound: 'clap' }, { step: 6, duration: 2, sound: 'clap' }, { step: 8, duration: 4, sound: 'clap' }, { step: 12, duration: 4, sound: 'clap' }],
      explanation: {
        goal: "Esercizio di costruzione: posiziona gli Ottavi 1/8 al tempo 2 e completa la battuta di 4/4.",
        howToCount: "Conta: 'Ta' (1/4), 'Ti-Ti' (due 1/8), 'Ta' (1/4), 'Ta' (1/4).",
        hint: "Usa il pulsante 'Ascolta Versione Corretta' per verificare che la tua composizione sia identica al modello."
      }
    }
  ];

  area2Data.forEach((lvl, idx) => {
    levels.push({
      id: `R${idx + 9}`,
      globalId: idx + 9,
      section: 'rhythm',
      areaNumber: 2,
      areaTitle: "Area 2: Entrano gli ottavi (Ottavo 1/8, Ti-Ti)",
      title: lvl.title,
      description: lvl.desc,
      explanation: lvl.explanation,
      type: idx === 7 ? 'build' : 'tap',
      bpm: 80 + (idx * 2),
      timeSignature: '4/4',
      staffType: 'single',
      bars: lvl.bars || 1,
      totalSteps: (lvl.bars || 1) * 16,
      allowedFigures: ['whole', 'half', 'quarter', 'eighth'],
      allowedSounds: ['clap'],
      targetNotes: lvl.notes,
    });
  });

  // AREA 3: Entrano i sedicesimi (17-24) - Solo Clap. Sedicesimo 1/16 (Tiri-Tiri).
  const area3Data = [
    {
      title: "La Corsa delle Formiche",
      desc: "La quartina di Sedicesimi 1/16 (Semicroma): 4 note rapidissime in un solo quarto (Tiri-Tiri)!",
      notes: [0, 1, 2, 3].map(s => ({ step: s, duration: 1, sound: 'clap' })).concat([{ step: 4, duration: 4, sound: 'clap' }, { step: 8, duration: 4, sound: 'clap' }, { step: 12, duration: 4, sound: 'clap' }]),
      explanation: {
        goal: "Comprendere il Sedicesimo 1/16: servono ben 4 note per formare un solo Quarto 1/4.",
        howToCount: "Sillaba Kodály per i 4 sedicesimi: 'Tiri-Tiri' (rapidissimo). Seguito da 'Ta, Ta, Ta'.",
        hint: "Tieni le mani vicine ed esegui i quattro colpi con piccoli tocchi precisi e scattanti."
      }
    },
    {
      title: "Quartina a Metà",
      desc: "Quarto 1/4 iniziale, quartina di Sedicesimi 1/16 al secondo tempo, chiusura in Metà 2/4.",
      notes: [{ step: 0, duration: 4, sound: 'clap' }, { step: 4, duration: 1, sound: 'clap' }, { step: 5, duration: 1, sound: 'clap' }, { step: 6, duration: 1, sound: 'clap' }, { step: 7, duration: 1, sound: 'clap' }, { step: 8, duration: 8, sound: 'clap' }],
      explanation: {
        goal: "Inserire la quartina veloce al centro della battuta tra un quarto e una metà.",
        howToCount: "Pronuncia: 'Ta' (tempo 1), 'Tiri-Tiri' (tempo 2), 'Ta-a' (tempi 3 e 4).",
        hint: "Attento a non accelerare il tempo generale: solo le quattro note centrali sono veloci!"
      }
    },
    {
      title: "Doppia Raffica",
      desc: "Due quartine consecutive di Sedicesimi 1/16 (8 colpi veloci), seguite da due Quarti 1/4.",
      notes: [0, 1, 2, 3, 4, 5, 6, 7].map(s => ({ step: s, duration: 1, sound: 'clap' })).concat([{ step: 8, duration: 4, sound: 'clap' }, { step: 12, duration: 4, sound: 'clap' }]),
      explanation: {
        goal: "Mantenere l'agilità su due quartine di sedicesimi consecutive (8 sedicesimi).",
        howToCount: "Canta: 'Tiri-Tiri, Tiri-Tiri, Ta, Ta'.",
        hint: "Respira rilassato e usa la punta delle dita o il palmo leggero."
      }
    },
    {
      title: "Cascata di Note",
      desc: "Quarto 1/4, due Ottavi 1/8 e quartina di Sedicesimi 1/16: un'accelerazione progressiva!",
      notes: [{ step: 0, duration: 4, sound: 'clap' }, { step: 4, duration: 2, sound: 'clap' }, { step: 6, duration: 2, sound: 'clap' }, { step: 8, duration: 1, sound: 'clap' }, { step: 9, duration: 1, sound: 'clap' }, { step: 10, duration: 1, sound: 'clap' }, { step: 11, duration: 1, sound: 'clap' }, { step: 12, duration: 4, sound: 'clap' }],
      explanation: {
        goal: "Sperimentare l'accelerazione piramidale: Quarto (1 nota) -> Ottavi (2 note) -> Sedicesimi (4 note).",
        howToCount: "Pronuncia la formula: 'Ta, Ti-Ti, Tiri-Tiri, Ta'.",
        hint: "Ogni tempo contiene il doppio delle note rispetto al precedente: senti l'energia che cresce."
      }
    },
    {
      title: "Groove Sincopato",
      desc: "Sedicesimi 1/16 intercalati a Ottavi 1/8: il ritmo moderno e dinamico.",
      notes: [{ step: 0, duration: 2, sound: 'clap' }, { step: 2, duration: 1, sound: 'clap' }, { step: 3, duration: 1, sound: 'clap' }, { step: 4, duration: 4, sound: 'clap' }, { step: 8, duration: 2, sound: 'clap' }, { step: 10, duration: 2, sound: 'clap' }, { step: 12, duration: 4, sound: 'clap' }],
      explanation: {
        goal: "Eseguire la figura sincopata ottavo-sedicesimo: una delle combinazioni più amate nella musica moderna.",
        howToCount: "Sillaba Kodály: 'Ti-Tiri, Ta, Ti-Ti, Ta'.",
        hint: "Ascolta bene la versione corretta per cogliere l'accento tipico del groove."
      }
    },
    {
      title: "Tamburello Veloce",
      desc: "Quartina veloce al 1° e 3° quarto, Ottavi 1/8 al 2° e 4° quarto.",
      notes: [0, 1, 2, 3, 8, 9, 10, 11].map(s => ({ step: s, duration: 1, sound: 'clap' })).concat([{ step: 4, duration: 2, sound: 'clap' }, { step: 6, duration: 2, sound: 'clap' }, { step: 12, duration: 2, sound: 'clap' }, { step: 14, duration: 2, sound: 'clap' }]),
      explanation: {
        goal: "Alternare quartine di Sedicesimi 1/16 e coppie di Ottavi 1/8.",
        howToCount: "Formula: 'Tiri-Tiri, Ti-Ti, Tiri-Tiri, Ti-Ti'.",
        hint: "Mantieni la differenza chiara tra le 4 note veloci e le 2 note medie."
      }
    },
    {
      title: "Rullo da Concerto",
      desc: "Due battute che culminano con un crescendo di Sedicesimi 1/16.",
      bars: 2,
      notes: [{ step: 0, duration: 4, sound: 'clap' }, { step: 4, duration: 4, sound: 'clap' }, { step: 8, duration: 2, sound: 'clap' }, { step: 10, duration: 2, sound: 'clap' }, { step: 12, duration: 4, sound: 'clap' }, { step: 16, duration: 1, sound: 'clap' }, { step: 17, duration: 1, sound: 'clap' }, { step: 18, duration: 1, sound: 'clap' }, { step: 19, duration: 1, sound: 'clap' }, { step: 20, duration: 4, sound: 'clap' }, { step: 24, duration: 8, sound: 'clap' }],
      explanation: {
        goal: "Sviluppare un arco musicale completo con crescendo ritmico su due battute.",
        howToCount: "Battuta 1: 'Ta, Ta, Ti-Ti, Ta'. Battuta 2: 'Tiri-Tiri, Ta, Ta-a'.",
        hint: "Ascolta il modello corretto con le cuffie per apprezzare l'effetto di rullo del tamburo."
      }
    },
    {
      title: "Componi la Quartina",
      desc: "Trascina 4 Sedicesimi 1/16 per completare la battuta energetica.",
      notes: [{ step: 0, duration: 4, sound: 'clap' }, { step: 4, duration: 4, sound: 'clap' }, { step: 8, duration: 1, sound: 'clap' }, { step: 9, duration: 1, sound: 'clap' }, { step: 10, duration: 1, sound: 'clap' }, { step: 11, duration: 1, sound: 'clap' }, { step: 12, duration: 4, sound: 'clap' }],
      explanation: {
        goal: "Costruire una quartina di sedicesimi posizionandola al terzo quarto della battuta.",
        howToCount: "Conta: 'Ta (1), Ta (2), Tiri-Tiri (3), Ta (4)'.",
        hint: "Verifica che le 4 tessere di Sedicesimo 1/16 occupino esattamente lo spazio di un quarto."
      }
    }
  ];

  area3Data.forEach((lvl, idx) => {
    levels.push({
      id: `R${idx + 17}`,
      globalId: idx + 17,
      section: 'rhythm',
      areaNumber: 3,
      areaTitle: "Area 3: Entrano i sedicesimi (Sedicesimo 1/16, Tiri-Tiri)",
      title: lvl.title,
      description: lvl.desc,
      explanation: lvl.explanation,
      type: idx === 7 ? 'build' : 'tap',
      bpm: 82 + (idx * 2),
      timeSignature: '4/4',
      staffType: 'single',
      bars: lvl.bars || 1,
      totalSteps: (lvl.bars || 1) * 16,
      allowedFigures: ['whole', 'half', 'quarter', 'eighth', 'sixteenth'],
      allowedSounds: ['clap'],
      targetNotes: lvl.notes,
    });
  });

  // AREA 4: Le prime parti del corpo (25-30) - Mani, Cosce, Piedi
  const area4Data = [
    {
      title: "I Piedi della Terra",
      desc: "Il passo solido: introduzione dei Piedi (Kick drum basso e profondo, colore Verde).",
      notes: [{ step: 0, duration: 4, sound: 'feet' }, { step: 4, duration: 4, sound: 'clap' }, { step: 8, duration: 4, sound: 'feet' }, { step: 12, duration: 4, sound: 'clap' }],
      explanation: {
        goal: "Usare il corpo come strumento: i Piedi rappresentano il registro grave (basso) che radica il tempo.",
        howToCount: "Pronuncia e muoviti: 'Piede' (tempo 1), 'Mani' (tempo 2), 'Piede' (tempo 3), 'Mani' (tempo 4).",
        hint: "Batti il piede con decisione sul pavimento e batti le mani al petto."
      }
    },
    {
      title: "Tamburo sulle Cosce",
      desc: "Introduzione del tocco sulle Cosce (Suono medio caldo, colore Ambra).",
      notes: [{ step: 0, duration: 4, sound: 'thighs' }, { step: 4, duration: 4, sound: 'thighs' }, { step: 8, duration: 4, sound: 'clap' }, { step: 12, duration: 4, sound: 'clap' }],
      explanation: {
        goal: "Integrare il registro medio battendo con i palmi delle mani sulle cosce.",
        howToCount: "Canta: 'Cosce, Cosce, Mani, Mani'. Due colpi in basso e due in alto.",
        hint: "Batti con i palmi rilassati sopra le ginocchia per ottenere un suono pieno e piacevole."
      }
    },
    {
      title: "Passo e Battito (Rock Beat)",
      desc: "Piede al primo tempo, mani al secondo: la cellula fondamentale del ritmo moderno!",
      notes: [{ step: 0, duration: 4, sound: 'feet' }, { step: 4, duration: 4, sound: 'clap' }, { step: 8, duration: 4, sound: 'feet' }, { step: 12, duration: 4, sound: 'clap' }],
      explanation: {
        goal: "Coordinare due parti del corpo in un dialogo ritmico continuo.",
        howToCount: "Conta: 'Piede (1), Clap (2), Piede (3), Clap (4)'.",
        hint: "Questo è il ritmo che fa ballare tutto il mondo: sentiti un vero batterista rock!"
      }
    },
    {
      title: "Danza dei Tre Livelli",
      desc: "Piedi (basso) -> Cosce (medio) -> Mani (alto): un viaggio musicale lungo il corpo.",
      notes: [{ step: 0, duration: 4, sound: 'feet' }, { step: 4, duration: 4, sound: 'thighs' }, { step: 8, duration: 4, sound: 'clap' }, { step: 12, duration: 4, sound: 'clap' }],
      explanation: {
        goal: "Esplorare la spazialità del corpo in 3 livelli di altezza sonora: terra, centro, cielo.",
        howToCount: "Pronuncia: 'Basso (Piede), Medio (Cosce), Alto (Mani), Alto (Mani)'.",
        hint: "Solleva lo sguardo man mano che sali con il suono dal basso verso l'alto."
      }
    },
    {
      title: "Trotteggio con le Cosce",
      desc: "Ottavi 1/8 battuti velocemente sulle cosce, seguiti dal battito di mani in Quarti 1/4.",
      notes: [{ step: 0, duration: 2, sound: 'thighs' }, { step: 2, duration: 2, sound: 'thighs' }, { step: 4, duration: 4, sound: 'clap' }, { step: 8, duration: 2, sound: 'thighs' }, { step: 10, duration: 2, sound: 'thighs' }, { step: 12, duration: 4, sound: 'clap' }],
      explanation: {
        goal: "Eseguire gli Ottavi 1/8 sulle cosce con tocco alternato destra-sinistra.",
        howToCount: "Canta: 'Ti-Ti (Cosce), Ta (Mani), Ti-Ti (Cosce), Ta (Mani)'.",
        hint: "Usa mano destra e mano sinistra per fare il trotteggio sulle due cosce."
      }
    },
    {
      title: "Il Gigante e il Folletto",
      desc: "Piede pesante per due tempi (Metà 2/4), poi battimani vivaci in Ottavi 1/8 e Quarto 1/4.",
      notes: [{ step: 0, duration: 8, sound: 'feet' }, { step: 8, duration: 2, sound: 'clap' }, { step: 10, duration: 2, sound: 'clap' }, { step: 12, duration: 4, sound: 'clap' }],
      explanation: {
        goal: "Accostare un suono lungo e profondo (Piede) a suoni veloci e acuti (Mani).",
        howToCount: "Conta: 'Piede-e (tempi 1-2), Ti-Ti (tempo 3), Ta (tempo 4)'.",
        hint: "Fai vibrare il passo del gigante sul primo tempo e lascia volare il folletto alla fine."
      }
    }
  ];

  area4Data.forEach((lvl, idx) => {
    levels.push({
      id: `R${idx + 25}`,
      globalId: idx + 25,
      section: 'rhythm',
      areaNumber: 4,
      areaTitle: "Area 4: Le prime parti del corpo (Mani, Cosce, Piedi)",
      title: lvl.title,
      description: lvl.desc,
      explanation: lvl.explanation,
      type: 'tap',
      bpm: 85,
      timeSignature: '4/4',
      staffType: 'single',
      bars: 1,
      totalSteps: 16,
      allowedFigures: ['whole', 'half', 'quarter', 'eighth'],
      allowedSounds: ['clap', 'thighs', 'feet'],
      targetNotes: lvl.notes,
    });
  });

  // AREA 5: Coordinazione totale (31-36) - 4 azioni: Clap, Cosce, Piedi, Dita (Snap)
  const area5Data = [
    {
      title: "Lo Schiocco delle Dita",
      desc: "Introduzione dello Schiocco delle Dita (Dita/Snap, registro acutissimo, colore Viola).",
      notes: [{ step: 0, duration: 4, sound: 'feet' }, { step: 4, duration: 4, sound: 'snap' }, { step: 8, duration: 4, sound: 'thighs' }, { step: 12, duration: 4, sound: 'snap' }],
      explanation: {
        goal: "Aggiungere il quarto strumento del corpo: lo schiocco delle dita (o click della lingua se non riesci a schioccare).",
        howToCount: "Pronuncia: 'Piede, Dita, Cosce, Dita'.",
        hint: "Lo schiocco deve essere breve, brillante e perfettamente a tempo."
      }
    },
    {
      title: "La Piramide Corporea",
      desc: "Dal basso verso l'alto: Piedi -> Cosce -> Mani -> Dita in 4 Quarti 1/4 perfetti.",
      notes: [{ step: 0, duration: 4, sound: 'feet' }, { step: 4, duration: 4, sound: 'thighs' }, { step: 8, duration: 4, sound: 'clap' }, { step: 12, duration: 4, sound: 'snap' }],
      explanation: {
        goal: "Eseguire la scala completa della Body Percussion che sale gradino dopo gradino.",
        howToCount: "Conta salendo: '1 (Piede) - 2 (Cosce) - 3 (Mani) - 4 (Dita)'.",
        hint: "Memorizza il tragitto: terra, ginocchia, petto, aria."
      }
    },
    {
      title: "Discesa a Spirale",
      desc: "Dall'alto verso il basso: Dita -> Mani -> Cosce -> Piedi.",
      notes: [{ step: 0, duration: 4, sound: 'snap' }, { step: 4, duration: 4, sound: 'clap' }, { step: 8, duration: 4, sound: 'thighs' }, { step: 12, duration: 4, sound: 'feet' }],
      explanation: {
        goal: "Invertire la sequenza corporea: iniziare dallo schiocco e scendere fino al colpo di piede.",
        howToCount: "Conta scendendo: '1 (Dita) - 2 (Mani) - 3 (Cosce) - 4 (Piede)'.",
        hint: "Controlla il peso del corpo mentre scendi per concludere sul battito solido a terra."
      }
    },
    {
      title: "Poliritmia Corporea",
      desc: "Piede, due colpi rapidi sulle cosce, battimani e schiocco finale.",
      notes: [{ step: 0, duration: 4, sound: 'feet' }, { step: 4, duration: 2, sound: 'thighs' }, { step: 6, duration: 2, sound: 'thighs' }, { step: 8, duration: 4, sound: 'clap' }, { step: 12, duration: 4, sound: 'snap' }],
      explanation: {
        goal: "Combinare durate diverse (Quarti 1/4 e Ottavi 1/8) su 4 parti del corpo differenti.",
        howToCount: "Formula ritmica: 'Piede (Ta), Cosce (Ti-Ti), Clap (Ta), Dita (Ta)'.",
        hint: "Ascolta la versione modello per coordinare le braccia sulle cosce prima del clap."
      }
    },
    {
      title: "Body Percussion Groove",
      desc: "Due battute piene di coordinazione corporea complessa a 4 suoni diversi.",
      bars: 2,
      notes: [{ step: 0, duration: 4, sound: 'feet' }, { step: 4, duration: 4, sound: 'clap' }, { step: 8, duration: 2, sound: 'thighs' }, { step: 10, duration: 2, sound: 'thighs' }, { step: 12, duration: 4, sound: 'snap' }, { step: 16, duration: 4, sound: 'feet' }, { step: 20, duration: 4, sound: 'clap' }, { step: 24, duration: 4, sound: 'thighs' }, { step: 28, duration: 4, sound: 'snap' }],
      explanation: {
        goal: "Eseguire una vera coreografia ritmica completa su due battute.",
        howToCount: "Battuta 1: 'Piede, Clap, Ti-Ti Cosce, Dita'. Battuta 2: 'Piede, Clap, Cosce, Dita'.",
        hint: "Ascolta la versione corretta più volte: è una vera mini-canzone solo di gesti e suoni!"
      }
    },
    {
      title: "Costruisci il tuo Body Groove",
      desc: "Combina piedi, cosce, mani e dita per formare la sequenza perfetta sulla griglia.",
      notes: [{ step: 0, duration: 4, sound: 'feet' }, { step: 4, duration: 4, sound: 'clap' }, { step: 8, duration: 4, sound: 'thighs' }, { step: 12, duration: 4, sound: 'snap' }],
      explanation: {
        goal: "Costruire sulla griglia una partitura per Body Percussion posizionando ogni suono sulla sua riga.",
        howToCount: "Verifica che ogni riga abbia il suo Quarto 1/4 e che il totale faccia 4/4.",
        hint: "Trascina la figura Quarto 1/4 sulle 4 righe della partitura."
      }
    }
  ];

  area5Data.forEach((lvl, idx) => {
    levels.push({
      id: `R${idx + 31}`,
      globalId: idx + 31,
      section: 'rhythm',
      areaNumber: 5,
      areaTitle: "Area 5: Coordinazione Corporea Totale (Clap, Cosce, Piedi, Dita)",
      title: lvl.title,
      description: lvl.desc,
      explanation: lvl.explanation,
      type: idx === 5 ? 'build' : 'tap',
      bpm: 88,
      timeSignature: '4/4',
      staffType: 'single',
      bars: lvl.bars || 1,
      totalSteps: (lvl.bars || 1) * 16,
      allowedFigures: ['half', 'quarter', 'eighth', 'sixteenth'],
      allowedSounds: ['clap', 'chest', 'thighs', 'feet', 'snap'],
      targetNotes: lvl.notes,
    });
  });

  // AREA 6: Complessità, Pause e Petto (37-42)
  const area6Data = [
    {
      title: "Il Suono del Silenzio (Pausa di Quarto 1/4)",
      desc: "Impara la Pausa di Quarto 1/4 (𝄽): un tempo intero di ascolto assoluto!",
      notes: [{ step: 0, duration: 4, sound: 'clap' }, { step: 4, duration: 4, isRest: true }, { step: 8, duration: 4, sound: 'clap' }, { step: 12, duration: 4, isRest: true }],
      explanation: {
        goal: "Comprendere che la pausa ha lo stesso valore temporale della nota, ma è silenzio.",
        howToCount: "Pronuncia: 'Ta' (suono), 'Shh' (pausa), 'Ta' (suono), 'Shh' (pausa).",
        hint: "Sulla pausa apri le mani verso l'esterno per trattenere il gesto senza produrre rumore."
      }
    },
    {
      title: "Il Battito del Petto",
      desc: "Il tamburo del petto (colore Rosa/Corallo): cupo, interiore e rassicurante.",
      notes: [{ step: 0, duration: 4, sound: 'chest' }, { step: 4, duration: 4, sound: 'clap' }, { step: 8, duration: 4, sound: 'chest' }, { step: 12, duration: 4, isRest: true }],
      explanation: {
        goal: "Sperimentare la risonanza della cassa toracica: batti delicatamente con la mano a coppa sul petto.",
        howToCount: "Canta: 'Petto (Ta), Clap (Ta), Petto (Ta), Silenzio (Pausa)'.",
        hint: "Non picchiare forte: una mano rilassata a conchiglia produce un suono caldo e profondo."
      }
    },
    {
      title: "Piccolo Respiro (Pausa di Ottavo 1/8)",
      desc: "La Pausa di Ottavo 1/8 (𝄾): mezzo tempo di silenzio tra le note veloci.",
      notes: [{ step: 0, duration: 2, isRest: true }, { step: 2, duration: 2, sound: 'clap' }, { step: 4, duration: 4, sound: 'chest' }, { step: 8, duration: 2, sound: 'clap' }, { step: 10, duration: 2, isRest: true }, { step: 12, duration: 4, sound: 'clap' }],
      explanation: {
        goal: "Eseguire la pausa breve (Ottavo 1/8) in levare: una delle abilità ritmiche più affascinanti.",
        howToCount: "Formula: 'Shh-Ti, Ta, Ti-Shh, Ta'.",
        hint: "Ascolta la versione corretta per percepire il respiro millimetrico prima del battito di mani."
      }
    },
    {
      title: "Il Tamburo del Cuore",
      desc: "Due colpi al petto in Ottavi 1/8, silenzio, battito di mani e schiocco finale.",
      notes: [{ step: 0, duration: 2, sound: 'chest' }, { step: 2, duration: 2, sound: 'chest' }, { step: 4, duration: 4, isRest: true }, { step: 8, duration: 4, sound: 'clap' }, { step: 12, duration: 4, sound: 'snap' }],
      explanation: {
        goal: "Riprodurre il ritmo del cuore umano (tum-tum) seguito da pausa e risposta brillante.",
        howToCount: "Formula: 'Tum-Tum (due 1/8 al petto), Silenzio (1/4 pausa), Clap (1/4), Dita (1/4)'.",
        hint: "Il contrasto tra il petto cupo e lo schiocco acuto è magico."
      }
    },
    {
      title: "Groove Maestoso con Pause",
      desc: "Due battute complesse che fondono tutte e 5 le percussioni corporee e i silenzi.",
      bars: 2,
      notes: [{ step: 0, duration: 4, sound: 'feet' }, { step: 4, duration: 4, isRest: true }, { step: 8, duration: 2, sound: 'chest' }, { step: 10, duration: 2, sound: 'chest' }, { step: 12, duration: 4, sound: 'clap' }, { step: 16, duration: 4, isRest: true }, { step: 20, duration: 4, sound: 'thighs' }, { step: 24, duration: 4, sound: 'snap' }, { step: 28, duration: 4, sound: 'feet' }],
      explanation: {
        goal: "Dominare il silenzio e il suono in una complessa frase poliritmica.",
        howToCount: "Battuta 1: 'Piede, Pausa, Petto-Petto, Clap'. Battuta 2: 'Pausa, Cosce, Dita, Piede'.",
        hint: "Usa il pulsante 'Ascolta Versione Corretta' per assimilare le pause prima di suonare."
      }
    },
    {
      title: "La Pausa Mancante",
      desc: "Trascina la Pausa di Quarto 1/4 nello spazio vuoto per dare respiro al brano.",
      notes: [{ step: 0, duration: 4, sound: 'chest' }, { step: 4, duration: 4, sound: 'clap' }, { step: 8, duration: 4, isRest: true }, { step: 12, duration: 4, sound: 'clap' }],
      explanation: {
        goal: "Riconoscere dove collocare la Pausa di Quarto 1/4 per completare il disegno ritmico.",
        howToCount: "Conta: 'Petto (1), Clap (2), Silenzio (3), Clap (4)'.",
        hint: "La pausa va inserita al tempo 3 (sedicesimo step 8)."
      }
    }
  ];

  area6Data.forEach((lvl, idx) => {
    levels.push({
      id: `R${idx + 37}`,
      globalId: idx + 37,
      section: 'rhythm',
      areaNumber: 6,
      areaTitle: "Area 6: Complessità, Pause e Tamburo del Petto",
      title: lvl.title,
      description: lvl.desc,
      explanation: lvl.explanation,
      type: idx === 5 ? 'build' : 'tap',
      bpm: 85,
      timeSignature: '4/4',
      staffType: 'single',
      bars: lvl.bars || 1,
      totalSteps: (lvl.bars || 1) * 16,
      allowedFigures: ['half', 'quarter', 'eighth', 'rest_quarter', 'rest_eighth'],
      allowedSounds: ['clap', 'chest', 'thighs', 'feet', 'snap'],
      targetNotes: lvl.notes,
    });
  });

  // AREA 7: Ascolto e Riconoscimento (43-45)
  levels.push({
    id: 'R43',
    globalId: 43,
    section: 'rhythm',
    areaNumber: 7,
    areaTitle: "Area 7: Ascolto e Riconoscimento (Dettati Ritmici)",
    title: "Dettato 1: Quarti o Ottavi?",
    description: "Ascolta attentamente il ritmo suonato dall'app e scegli quale sequenza corrisponde.",
    explanation: {
      goal: "Distinguere ad orecchio tra Quarti 1/4 (Ta) e Ottavi 1/8 (Ti-Ti).",
      howToCount: "Ascolta se i colpi sono singoli (1 tempo) o doppi (2 colpi in 1 tempo).",
      hint: "Clicca su 'Ascolta il Ritmo' quante volte vuoi prima di rispondere."
    },
    type: 'dictation',
    bpm: 80,
    timeSignature: '4/4',
    staffType: 'single',
    bars: 1,
    totalSteps: 16,
    allowedFigures: ['quarter', 'eighth'],
    allowedSounds: ['clap'],
    targetNotes: [{ step: 0, duration: 4, sound: 'clap' }, { step: 4, duration: 2, sound: 'clap' }, { step: 6, duration: 2, sound: 'clap' }, { step: 8, duration: 4, sound: 'clap' }, { step: 12, duration: 4, sound: 'clap' }],
    options: [
      { id: 'optA', label: "Ta, Ta, Ta, Ta (4 Quarti 1/4)", isCorrect: false },
      { id: 'optB', label: "Ta, Ti-Ti, Ta, Ta (Quarto 1/4, due Ottavi 1/8, due Quarti 1/4)", isCorrect: true },
      { id: 'optC', label: "Ti-Ti, Ti-Ti, Ta, Ta (Quattro Ottavi 1/8, due Quarti 1/4)", isCorrect: false }
    ]
  });

  levels.push({
    id: 'R44',
    globalId: 44,
    section: 'rhythm',
    areaNumber: 7,
    areaTitle: "Area 7: Ascolto e Riconoscimento (Dettati Ritmici)",
    title: "Dettato 2: Dov'è la Pausa?",
    description: "Ascolta il ritmo: una delle battute ha una pausa di silenzio al terzo quarto. Identificala!",
    explanation: {
      goal: "Riconoscere la posizione del silenzio (Pausa di Quarto 1/4) in una frase musicale.",
      howToCount: "Conta i 4 battiti del metronomo e nota su quale battito non c'è suono.",
      hint: "La pausa si trova esattamente sul terzo quarto."
    },
    type: 'dictation',
    bpm: 80,
    timeSignature: '4/4',
    staffType: 'single',
    bars: 1,
    totalSteps: 16,
    allowedFigures: ['quarter', 'rest_quarter'],
    allowedSounds: ['clap'],
    targetNotes: [{ step: 0, duration: 4, sound: 'clap' }, { step: 4, duration: 4, sound: 'clap' }, { step: 8, duration: 4, isRest: true }, { step: 12, duration: 4, sound: 'clap' }],
    options: [
      { id: 'optA', label: "Ta, Silenzio, Ta, Ta (Pausa al 2° quarto)", isCorrect: false },
      { id: 'optB', label: "Ta, Ta, Silenzio, Ta (Pausa al 3° quarto)", isCorrect: true },
      { id: 'optC', label: "Ta, Ta, Ta, Silenzio (Pausa al 4° quarto)", isCorrect: false }
    ]
  });

  levels.push({
    id: 'R45',
    globalId: 45,
    section: 'rhythm',
    areaNumber: 7,
    areaTitle: "Area 7: Ascolto e Riconoscimento (Dettati Ritmici)",
    title: "Dettato 3: Ricostruzione ad Orecchio",
    description: "Ascolta la melodia ritmica ed inserisci sulla griglia le note corrispondenti nell'ordine corretto.",
    explanation: {
      goal: "Ricostruire ad orecchio una battuta di Body Percussion combinando Piedi e Mani.",
      howToCount: "Piede (Quarto 1/4) -> Mani (due Ottavi 1/8) -> Piede lungo (Metà 2/4).",
      hint: "Premi 'Ascolta Versione Corretta' per ascoltare il modello e posiziona le note sulla griglia."
    },
    type: 'build',
    bpm: 85,
    timeSignature: '4/4',
    staffType: 'single',
    bars: 1,
    totalSteps: 16,
    allowedFigures: ['half', 'quarter', 'eighth'],
    allowedSounds: ['clap', 'feet'],
    targetNotes: [{ step: 0, duration: 4, sound: 'feet' }, { step: 4, duration: 2, sound: 'clap' }, { step: 6, duration: 2, sound: 'clap' }, { step: 8, duration: 8, sound: 'feet' }],
  });

  // AREA 8: Composizione e Matematica Musicale (46-48)
  levels.push({
    id: 'R46',
    globalId: 46,
    section: 'rhythm',
    areaNumber: 8,
    areaTitle: "Area 8: Composizione e Matematica Musicale (Verifica del 4/4)",
    title: "La Magia del Quattro Quarti",
    description: "Componi una battuta libera! La somma matematica delle figure deve fare esattamente 4/4 ($16$ sedicesimi).",
    explanation: {
      goal: "Sperimentare la composizione libera verificando la regola aurea del tempo: $4/4 = 16/16$.",
      howToCount: "Ogni figura ha un valore: Intero = 4/4, Metà = 2/4, Quarto = 1/4, Ottavo = 1/8. La somma deve dare 4/4.",
      hint: "Guarda il diagramma a torta a 4 fette: si illuminerà completamente di verde quando la battuta è perfetta!"
    },
    type: 'compose',
    bpm: 90,
    timeSignature: '4/4',
    staffType: 'single',
    bars: 1,
    totalSteps: 16,
    allowedFigures: ['whole', 'half', 'quarter', 'eighth', 'rest_quarter'],
    allowedSounds: ['clap', 'chest', 'thighs', 'feet', 'snap'],
    targetNotes: [{ step: 0, duration: 4, sound: 'feet' }, { step: 4, duration: 2, sound: 'thighs' }, { step: 6, duration: 2, sound: 'thighs' }, { step: 8, duration: 4, sound: 'clap' }, { step: 12, duration: 4, sound: 'snap' }],
  });

  levels.push({
    id: 'R47',
    globalId: 47,
    section: 'rhythm',
    areaNumber: 8,
    areaTitle: "Area 8: Composizione e Matematica Musicale (Verifica del 4/4)",
    title: "Composizione a Due Battute",
    description: "Crea una sequenza di 2 battute ($8$ tempi totali) usando Body Percussion a piacere.",
    explanation: {
      goal: "Comporre una frase musicale completa su 2 battute con domanda e risposta ritmica.",
      howToCount: "Battuta 1 = 4 tempi, Battuta 2 = 4 tempi. Totale = 8 quarti.",
      hint: "Ascolta il modello d'autore con 'Ascolta Versione Corretta' per trarre ispirazione."
    },
    type: 'compose',
    bpm: 95,
    timeSignature: '4/4',
    staffType: 'single',
    bars: 2,
    totalSteps: 32,
    allowedFigures: ['whole', 'half', 'quarter', 'eighth', 'sixteenth', 'rest_quarter'],
    allowedSounds: ['clap', 'chest', 'thighs', 'feet', 'snap'],
    targetNotes: [{ step: 0, duration: 4, sound: 'feet' }, { step: 4, duration: 4, sound: 'clap' }, { step: 8, duration: 2, sound: 'thighs' }, { step: 10, duration: 2, sound: 'thighs' }, { step: 12, duration: 4, sound: 'snap' }, { step: 16, duration: 4, sound: 'feet' }, { step: 20, duration: 4, sound: 'clap' }, { step: 24, duration: 8, sound: 'feet' }],
  });

  levels.push({
    id: 'R48',
    globalId: 48,
    section: 'rhythm',
    areaNumber: 8,
    areaTitle: "Area 8: Composizione e Matematica Musicale (Verifica del 4/4)",
    title: "Il Concerto Finale del Ritmo",
    description: "Livello Maestro del Ritmo: componi liberamente usando tutti gli strumenti e le figure imparate!",
    explanation: {
      goal: "Compiere il percorso ritmico fondendo Body Percussion e Strumentario Orff in una grande opera percussiva.",
      howToCount: "Costruisci ritmi sovrapposti e incastri precisi su 2 battute complete.",
      hint: "Premi 'Ascolta Versione Corretta' per ascoltare la grande fanfara percussiva modello!"
    },
    type: 'compose',
    bpm: 100,
    timeSignature: '4/4',
    staffType: 'single',
    bars: 2,
    totalSteps: 32,
    allowedFigures: ['whole', 'half', 'quarter', 'eighth', 'sixteenth', 'rest_quarter', 'rest_eighth'],
    allowedSounds: ['clap', 'chest', 'thighs', 'feet', 'snap', 'claves', 'tambourine', 'triangle', 'cymbals'],
    targetNotes: [{ step: 0, duration: 4, sound: 'feet' }, { step: 4, duration: 2, sound: 'claves' }, { step: 6, duration: 2, sound: 'claves' }, { step: 8, duration: 4, sound: 'tambourine' }, { step: 12, duration: 4, sound: 'triangle' }, { step: 16, duration: 4, sound: 'feet' }, { step: 20, duration: 4, sound: 'clap' }, { step: 24, duration: 4, sound: 'thighs' }, { step: 28, duration: 4, sound: 'cymbals' }],
  });

  return levels;
}

// Generate 40 Melodic & Solmization Levels with full didactic explanations
function generateMelodicCurriculum() {
  const levels = [];

  // MODULO 1: Il Nucleo Infantile (1-8) - Bigramma (2 linee). Sol, Mi e La.
  const mod1Data = [
    {
      title: "Il Cucù della Foresta",
      desc: "La terza minore discendente (Sol -> Mi): il richiamo naturale universale dell'infanzia.",
      notes: [{ step: 0, duration: 4, pitch: 'SOL' }, { step: 4, duration: 4, pitch: 'MI' }, { step: 8, duration: 4, pitch: 'SOL' }, { step: 12, duration: 4, pitch: 'MI' }],
      explanation: {
        goal: "Esplorare l'intervallo di terza minore Sol - Mi sul Bigramma a 2 linee. È l'intervallo con cui i bambini di tutte le culture intonano i primi canti.",
        howToCount: "Canta con le sillabe Kodály: 'Sol' (linea alta), 'Mi' (linea bassa), 'Sol', 'Mi'.",
        hint: "Usa i segni delle mani (Chironomia): Sol = palmo verso di te; Mi = palmo orizzontale verso il basso."
      }
    },
    {
      title: "Eco tra le Montagne",
      desc: "Sol tenuto a lungo in Metà 2/4, poi due Mi veloci in Quarti 1/4.",
      notes: [{ step: 0, duration: 8, pitch: 'SOL' }, { step: 8, duration: 4, pitch: 'MI' }, { step: 12, duration: 4, pitch: 'MI' }],
      explanation: {
        goal: "Unire altezza melodica e durata delle figure: la Metà 2/4 risuona più a lungo dei Quarti 1/4.",
        howToCount: "Canta: 'Sol-ol' (dura due tempi), 'Mi' (un tempo), 'Mi' (un tempo).",
        hint: "Ascolta come il metallofono fa vibrare la barra del Sol più a lungo."
      }
    },
    {
      title: "Entra il Sole (Aggiunta del La)",
      desc: "Il La sta nello spazio sopra il Sol: Sol-La-Sol-Mi, la formula regina delle filastrocche.",
      notes: [{ step: 0, duration: 4, pitch: 'SOL' }, { step: 4, duration: 4, pitch: 'LA' }, { step: 8, duration: 4, pitch: 'SOL' }, { step: 12, duration: 4, pitch: 'MI' }],
      explanation: {
        goal: "Aggiungere la nota La, collocata sopra la seconda linea del Bigramma.",
        howToCount: "Canta: 'Sol' (linea 2), 'La' (spazio sopra), 'Sol' (linea 2), 'Mi' (linea 1).",
        hint: "Chironomia: il La ha la mano arrotondata a cupola rivolta verso il basso."
      }
    },
    {
      title: "Girotondo con La",
      desc: "Canta con le mani: La (alto), Sol (medio), La, Sol.",
      notes: [{ step: 0, duration: 4, pitch: 'LA' }, { step: 4, duration: 4, pitch: 'SOL' }, { step: 8, duration: 4, pitch: 'LA' }, { step: 12, duration: 4, pitch: 'SOL' }],
      explanation: {
        goal: "Memorizzare l'oscillazione tra La e Sol sul Bigramma.",
        howToCount: "Canta: 'La - Sol - La - Sol'.",
        hint: "Il La è un gradino sopra il Sol: senti come galleggia dolcemente sopra la linea."
      }
    },
    {
      title: "Ninna Nanna Infantile",
      desc: "Due battute sul celebre modello di ninna nanna tradizionale Kodály (Sol-Sol-Mi, La-Sol-Mi).",
      bars: 2,
      notes: [{ step: 0, duration: 4, pitch: 'SOL' }, { step: 4, duration: 4, pitch: 'SOL' }, { step: 8, duration: 8, pitch: 'MI' }, { step: 16, duration: 4, pitch: 'LA' }, { step: 20, duration: 4, pitch: 'SOL' }, { step: 24, duration: 8, pitch: 'MI' }],
      explanation: {
        goal: "Costruire una frase melodica completa su 2 battute usando il tritono infantile Sol-La-Mi.",
        howToCount: "Battuta 1: 'Sol, Sol, Mi-i'. Battuta 2: 'La, Sol, Mi-i'.",
        hint: "Ascolta la versione corretta: è una dolcissima melodia usata nelle scuole di tutto il mondo."
      }
    },
    {
      title: "Sinfonia dei Giocattoli (Tema)",
      desc: "Tratto dal celebre motivo infantile della Sinfonia dei Giocattoli (Kindersinfonie).",
      notes: [{ step: 0, duration: 2, pitch: 'SOL' }, { step: 2, duration: 2, pitch: 'MI' }, { step: 4, duration: 4, pitch: 'SOL' }, { step: 8, duration: 2, pitch: 'SOL' }, { step: 10, duration: 2, pitch: 'MI' }, { step: 12, duration: 4, pitch: 'SOL' }],
      explanation: {
        goal: "Eseguire note veloci in Ottavi 1/8 su altezze melodiche diverse (Sol e Mi).",
        howToCount: "Canta con ritmo brillante: 'Sol-Mi, Sol, Sol-Mi, Sol'.",
        hint: "I due ottavi Sol-Mi scendono velocemente come il canto di un uccellino giocattolo."
      }
    },
    {
      title: "Chironomia: Riconosci il Segno",
      desc: "Attiva i segni delle mani di Kodály e abbina il gesto visivo alla nota giusta.",
      notes: [{ step: 0, duration: 4, pitch: 'MI' }, { step: 4, duration: 4, pitch: 'SOL' }, { step: 8, duration: 4, pitch: 'LA' }, { step: 12, duration: 4, pitch: 'SOL' }],
      explanation: {
        goal: "Fissare nella memoria visiva e cinestetica i segni delle mani per Mi, Sol e La.",
        howToCount: "Gesto Mi (mano orizzontale) -> Gesto Sol (palmo frontale) -> Gesto La (cupola).",
        hint: "Osserva le icone dei gesti posizionate sopra ogni testa di nota."
      }
    },
    {
      title: "Componi con Sol-La-Mi",
      desc: "Trascina le note sulle 2 linee del Bigramma per creare il tuo richiamo infantile.",
      notes: [{ step: 0, duration: 4, pitch: 'SOL' }, { step: 4, duration: 4, pitch: 'MI' }, { step: 8, duration: 4, pitch: 'SOL' }, { step: 12, duration: 4, pitch: 'MI' }],
      explanation: {
        goal: "Costruire sul Bigramma una melodia rispettando il 4/4 e posizionando le note sulle linee e nello spazio.",
        howToCount: "Sol sulla linea 2 (in alto), Mi sulla linea 1 (in basso), La nello spazio sopra.",
        hint: "Usa 'Ascolta Versione Corretta' per confrontare la tua composizione con il modello."
      }
    }
  ];

  mod1Data.forEach((lvl, idx) => {
    levels.push({
      id: `M${idx + 1}`,
      globalId: 48 + idx + 1,
      section: 'melody',
      areaNumber: 1,
      areaTitle: "Modulo 1: Il Nucleo Infantile (Bigramma: Sol, Mi, La)",
      title: lvl.title,
      description: lvl.desc,
      explanation: lvl.explanation,
      type: idx === 7 ? 'build' : 'tap',
      bpm: 80,
      timeSignature: '4/4',
      staffType: 'bigram',
      bars: lvl.bars || 1,
      totalSteps: (lvl.bars || 1) * 16,
      allowedFigures: ['half', 'quarter', 'eighth'],
      allowedPitches: ['MI', 'SOL', 'LA'],
      chironomyEnabled: true,
      targetNotes: lvl.notes,
    });
  });

  // MODULO 2: La Scala Pentatonica (9-16) - Trigramma (3 linee). Do, Re, Mi, Sol, La.
  const mod2Data = [
    {
      title: "La Base Solida: Arriva il Do",
      desc: "Il Do fondamentale dona stabilità e completezza alla melodia (linea 1 del Trigramma).",
      notes: [{ step: 0, duration: 4, pitch: 'DO' }, { step: 4, duration: 4, pitch: 'MI' }, { step: 8, duration: 4, pitch: 'SOL' }, { step: 12, duration: 4, pitch: 'DO' }],
      explanation: {
        goal: "Introdurre la nota tonica Do sul Trigramma a 3 linee: la nota 'casa' da cui si parte e a cui si torna.",
        howToCount: "Canta: 'Do (basso) -> Mi (medio) -> Sol (alto) -> Do (ritorno a casa)'.",
        hint: "Chironomia del Do: pugno chiuso fermo e solido come una roccia."
      }
    },
    {
      title: "Il Ponte del Re",
      desc: "Il Re nello spazio collega dolcemente il Do con il Mi: Do -> Re -> Mi.",
      notes: [{ step: 0, duration: 4, pitch: 'DO' }, { step: 4, duration: 4, pitch: 'RE' }, { step: 8, duration: 4, pitch: 'MI' }, { step: 12, duration: 4, pitch: 'DO' }],
      explanation: {
        goal: "Inserire la nota Re nello spazio 1, tra la linea 1 (Do) e la linea 2 (Mi).",
        howToCount: "Canta la scaletta: 'Do - Re - Mi - Do'.",
        hint: "Chironomia del Re: palmo inclinato verso l'alto a formare una rampa che sale verso il Mi."
      }
    },
    {
      title: "La Scala Pentatonica Completa",
      desc: "Tutte le 5 note sorelle che non stonano mai: Do - Re - Mi - Sol - La.",
      notes: [{ step: 0, duration: 2, pitch: 'DO' }, { step: 2, duration: 2, pitch: 'RE' }, { step: 4, duration: 4, pitch: 'MI' }, { step: 8, duration: 4, pitch: 'SOL' }, { step: 12, duration: 4, pitch: 'LA' }],
      explanation: {
        goal: "Cantare e suonare tutte le 5 note della scala pentatonica: priva di semitoni aspri, sempre armoniosa.",
        howToCount: "Canta la salita: 'Do, Re, Mi, Sol, La'.",
        hint: "Ascolta la versione corretta: è la scala alla base delle musiche tradizionali di tutto il pianeta."
      }
    },
    {
      title: "Canto Folk delle Colline",
      desc: "Melodia pentatonica dal sapore antico su Trigramma.",
      notes: [{ step: 0, duration: 4, pitch: 'SOL' }, { step: 4, duration: 4, pitch: 'MI' }, { step: 8, duration: 4, pitch: 'RE' }, { step: 12, duration: 4, pitch: 'DO' }],
      explanation: {
        goal: "Eseguire la discesa melodica pentatonica da Sol fino a Do.",
        howToCount: "Canta scendendo: 'Sol -> Mi -> Re -> Do'.",
        hint: "Senti come il Do finale placa la tensione e dà una sensazione di pace completa."
      }
    },
    {
      title: "Spiritual Pentatonico",
      desc: "Due battute ispirate ai canti popolari americani basati sulla pentatonica.",
      bars: 2,
      notes: [{ step: 0, duration: 4, pitch: 'DO' }, { step: 4, duration: 4, pitch: 'DO' }, { step: 8, duration: 4, pitch: 'RE' }, { step: 12, duration: 4, pitch: 'MI' }, { step: 16, duration: 4, pitch: 'SOL' }, { step: 20, duration: 4, pitch: 'MI' }, { step: 24, duration: 8, pitch: 'DO' }],
      explanation: {
        goal: "Sviluppare una melodia spiritual su due battute con ripetizione della tonica e slancio verso il Sol.",
        howToCount: "Battuta 1: 'Do, Do, Re, Mi'. Battuta 2: 'Sol, Mi, Do-o'.",
        hint: "Ascolta la versione modello: ha il calore tipico della musica popolare."
      }
    },
    {
      title: "Dettato Melodico Pentatonico",
      desc: "Ascolta la sequenza a tre note e scopri se sale o se scende.",
      notes: [{ step: 0, duration: 4, pitch: 'DO' }, { step: 4, duration: 4, pitch: 'MI' }, { step: 8, duration: 4, pitch: 'SOL' }, { step: 12, duration: 4, pitch: 'LA' }],
      explanation: {
        goal: "Riconoscere l'andamento melodico ascendente della pentatonica.",
        howToCount: "Ascolta il registro che sale gradualmente verso l'acuto.",
        hint: "Clicca su 'Ascolta Versione Corretta' per intonare le note mentalmente prima di rispondere."
      }
    },
    {
      title: "Campanelle d'Oriente",
      desc: "Un motivo dolce e cristallino che sfrutta l'armonia della pentatonica.",
      notes: [{ step: 0, duration: 2, pitch: 'LA' }, { step: 2, duration: 2, pitch: 'SOL' }, { step: 4, duration: 4, pitch: 'MI' }, { step: 8, duration: 2, pitch: 'RE' }, { step: 10, duration: 2, pitch: 'MI' }, { step: 12, duration: 4, pitch: 'DO' }],
      explanation: {
        goal: "Combinare Ottavi 1/8 e Quarti 1/4 con le 5 note pentatoniche.",
        howToCount: "Canta: 'La-Sol (Ti-Ti), Mi (Ta), Re-Mi (Ti-Ti), Do (Ta)'.",
        hint: "Cambia timbro in 'Glockenspiel' dal menu per sentire un vero effetto campanella metallica!"
      }
    },
    {
      title: "Costruzione Pentatonica",
      desc: "Posiziona Do, Re, Mi, Sol, La sul Trigramma e ascolta la sinfonia.",
      notes: [{ step: 0, duration: 4, pitch: 'DO' }, { step: 4, duration: 4, pitch: 'RE' }, { step: 8, duration: 4, pitch: 'SOL' }, { step: 12, duration: 4, pitch: 'DO' }],
      explanation: {
        goal: "Esercizio di scrittura: posizionare correttamente le note sulle 3 linee e 2 spazi del Trigramma.",
        howToCount: "Do (linea 1), Re (spazio 1), Sol (linea 3), Do (linea 1).",
        hint: "Usa 'Ascolta Versione Corretta' per verificare che il tuo spartito corrisponda alla melodia modello."
      }
    }
  ];

  mod2Data.forEach((lvl, idx) => {
    levels.push({
      id: `M${idx + 9}`,
      globalId: 48 + idx + 9,
      section: 'melody',
      areaNumber: 2,
      areaTitle: "Modulo 2: La Scala Pentatonica (Trigramma: Do, Re, Mi, Sol, La)",
      title: lvl.title,
      description: lvl.desc,
      explanation: lvl.explanation,
      type: idx === 7 ? 'build' : 'tap',
      bpm: 82,
      timeSignature: '4/4',
      staffType: 'trigram',
      bars: lvl.bars || 1,
      totalSteps: (lvl.bars || 1) * 16,
      allowedFigures: ['half', 'quarter', 'eighth'],
      allowedPitches: ['DO', 'RE', 'MI', 'SOL', 'LA'],
      chironomyEnabled: true,
      targetNotes: lvl.notes,
    });
  });

  // MODULO 3: Il Pentagramma Diatonico (17-24) - 5 linee. Fa e Si (semitoni).
  const mod3Data = [
    {
      title: "Il Grande Pentagramma a 5 Linee",
      desc: "Benvenuto nel pentagramma dei grandi musicisti con la Chiave di Violino!",
      notes: [{ step: 0, duration: 4, pitch: 'DO' }, { step: 4, duration: 4, pitch: 'MI' }, { step: 8, duration: 4, pitch: 'SOL' }, { step: 12, duration: 4, pitch: 'DO_HIGH' }],
      explanation: {
        goal: "Scoprire il Pentagramma completo a 5 linee e 4 spazi con la Chiave di Violino (G-Clef) che fissa il Sol sulla linea 2.",
        howToCount: "Canta l'arpeggio di Do maggiore: Do (taglio sotto), Mi (linea 1), Sol (linea 2), Do acuto (spazio 3).",
        hint: "Il Do centrale ha un taglietto sul corpo (taglio addizionale) perché sta sotto il pentagramma."
      }
    },
    {
      title: "Il Primo Semitono: Arriva il Fa",
      desc: "Il Fa è vicinissimo al Mi: senti come crea una tensione dolce verso il Sol.",
      notes: [{ step: 0, duration: 4, pitch: 'MI' }, { step: 4, duration: 4, pitch: 'FA' }, { step: 8, duration: 4, pitch: 'SOL' }, { step: 12, duration: 4, pitch: 'FA' }],
      explanation: {
        goal: "Sperimentare il primo semitono naturale della scala: tra Mi (linea 1) e Fa (spazio 1). C'è solo mezzo passo!",
        howToCount: "Canta: 'Mi -> Fa (semitono stretto) -> Sol -> Fa'.",
        hint: "Chironomia del Fa: pugno con il pollice rivolto verso il basso (tensione verso il Mi)."
      }
    },
    {
      title: "La Nota Sensibile: Il Si",
      desc: "Il Si sulla terza linea bussa alla porta del Do acuto: vuole risolvere verso l'alto.",
      notes: [{ step: 0, duration: 4, pitch: 'SOL' }, { step: 4, duration: 4, pitch: 'LA' }, { step: 8, duration: 4, pitch: 'SI' }, { step: 12, duration: 4, pitch: 'DO_HIGH' }],
      explanation: {
        goal: "Introdurre il Si (linea 3), la nota sensibile che dista solo un semitono dal Do acuto.",
        howToCount: "Canta: 'Sol -> La -> Si -> Do!'.",
        hint: "Chironomia del Si: dito indice puntato verso l'alto, ad indicare l'attrazione verso il Do."
      }
    },
    {
      title: "La Scala Maggiore Completa",
      desc: "Le 7 note al completo: Do, Re, Mi, Fa, Sol, La, Si, Do!",
      notes: [0, 2, 4, 6, 8, 10, 12, 14].map((s, i) => ({ step: s, duration: 2, pitch: ['DO', 'RE', 'MI', 'FA', 'SOL', 'LA', 'SI', 'DO_HIGH'][i] })),
      explanation: {
        goal: "Cantare ed eseguire la scala diatonica maggiore completa di 8 note in Ottavi 1/8.",
        howToCount: "Tutte le note in fila: Do, Re, Mi, Fa, Sol, La, Si, Do.",
        hint: "Ascolta come i semitoni Mi-Fa e Si-Do rendono la scala completa e brillante."
      }
    },
    {
      title: "Inno alla Gioia (Beethoven)",
      desc: "Il celebre inno europeo: Mi-Mi-Fa-Sol, Sol-Fa-Mi-Re suonato sul Pentagramma a 5 linee.",
      bars: 2,
      notes: [{ step: 0, duration: 4, pitch: 'MI' }, { step: 4, duration: 4, pitch: 'MI' }, { step: 8, duration: 4, pitch: 'FA' }, { step: 12, duration: 4, pitch: 'SOL' }, { step: 16, duration: 4, pitch: 'SOL' }, { step: 20, duration: 4, pitch: 'FA' }, { step: 24, duration: 4, pitch: 'MI' }, { step: 28, duration: 4, pitch: 'RE' }],
      explanation: {
        goal: "Suonare il capolavoro immortale di Ludwig van Beethoven tratto dalla Nona Sinfonia.",
        howToCount: "Battuta 1: 'Mi, Mi, Fa, Sol'. Battuta 2: 'Sol, Fa, Mi, Re'.",
        hint: "Ascolta la versione corretta per assaporare la maestosità di questa melodia universale."
      }
    },
    {
      title: "La Primavera (Vivaldi)",
      desc: "Il famoso tema festoso e squillante del capolavoro barocco di Antonio Vivaldi.",
      notes: [{ step: 0, duration: 4, pitch: 'SOL' }, { step: 4, duration: 2, pitch: 'LA' }, { step: 6, duration: 2, pitch: 'SI' }, { step: 8, duration: 4, pitch: 'DO_HIGH' }, { step: 12, duration: 4, pitch: 'SOL' }],
      explanation: {
        goal: "Eseguire il tema barocco della Primavera di Vivaldi con slancio ritmico.",
        howToCount: "Canta: 'Sol (1/4), La-Si (due 1/8), Do acuto (1/4), Sol (1/4)'.",
        hint: "I due ottavi La-Si salgono come lo sbocciare di un fiore verso il Do acuto."
      }
    },
    {
      title: "Dettato Diatonico",
      desc: "Riconosci ad orecchio l'intervallo tra Mi e Fa (il semitono naturale).",
      notes: [{ step: 0, duration: 4, pitch: 'MI' }, { step: 4, duration: 4, pitch: 'FA' }, { step: 8, duration: 8, pitch: 'SOL' }],
      explanation: {
        goal: "Riconoscere all'ascolto il passaggio stretto di semitono Mi -> Fa.",
        howToCount: "Canticchia a voce alta: 'Mi - Fa - Sol-ol'.",
        hint: "Usa 'Ascolta Versione Corretta' per confrontare l'altezza dei suoni prima di confermare."
      }
    },
    {
      title: "Composizione Guidata su Pentagramma",
      desc: "Posiziona le note sul Pentagramma a 5 linee per completare la frase musicale.",
      notes: [{ step: 0, duration: 4, pitch: 'DO' }, { step: 4, duration: 4, pitch: 'RE' }, { step: 8, duration: 4, pitch: 'MI' }, { step: 12, duration: 4, pitch: 'DO' }],
      explanation: {
        goal: "Trascrivere sul Pentagramma: Do (sotto la linea 1), Re (spazio sotto), Mi (linea 1), Do.",
        howToCount: "Conta i 4 quarti regolari: 1 - 2 - 3 - 4.",
        hint: "Verifica con 'Ascolta Versione Corretta' che la melodia suoni perfettamente intonata."
      }
    }
  ];

  mod3Data.forEach((lvl, idx) => {
    levels.push({
      id: `M${idx + 17}`,
      globalId: 48 + idx + 17,
      section: 'melody',
      areaNumber: 3,
      areaTitle: "Modulo 3: Il Pentagramma Diatonico (5 Linee, Chiave di Violino)",
      title: lvl.title,
      description: lvl.desc,
      explanation: lvl.explanation,
      type: idx === 7 ? 'build' : 'tap',
      bpm: 88,
      timeSignature: '4/4',
      staffType: 'pentagram',
      bars: lvl.bars || 1,
      totalSteps: (lvl.bars || 1) * 16,
      allowedFigures: ['half', 'quarter', 'eighth'],
      allowedPitches: ['DO', 'RE', 'MI', 'FA', 'SOL', 'LA', 'SI', 'DO_HIGH'],
      chironomyEnabled: true,
      targetNotes: lvl.notes,
    });
  });

  // MODULO 4: Indipendenza e Polifonia (25-32) - 2 Righi musicali.
  const mod4Data = [
    {
      title: "Il Bordone: La Nota Che Sorregge",
      desc: "Due voci contemporanee: il Bordone fisso di Do tiene il tappeto sonoro alla melodia.",
      polyphonyTracks: 2,
      notesTrack1: [{ step: 0, duration: 4, pitch: 'SOL' }, { step: 4, duration: 4, pitch: 'LA' }, { step: 8, duration: 4, pitch: 'SOL' }, { step: 12, duration: 4, pitch: 'MI' }],
      notesTrack2: [{ step: 0, duration: 16, pitch: 'DO' }],
      explanation: {
        goal: "Comprendere il principio della polifonia: due melodie diverse suonano nello stesso momento.",
        howToCount: "La voce inferiore suona un Intero 4/4 fisso sul Do; la voce superiore canta 'Sol, La, Sol, Mi'.",
        hint: "Ascolta la versione corretta per sentire come il Do basso fa brillare le note sopra."
      }
    },
    {
      title: "Bordone di Quinte (Do-Sol)",
      desc: "Due note di sostegno (Do e Sol) creano una ricca armonia medievale.",
      polyphonyTracks: 2,
      notesTrack1: [{ step: 0, duration: 4, pitch: 'MI' }, { step: 4, duration: 4, pitch: 'FA' }, { step: 8, duration: 4, pitch: 'SOL' }, { step: 12, duration: 4, pitch: 'MI' }],
      notesTrack2: [{ step: 0, duration: 8, pitch: 'DO' }, { step: 8, duration: 8, pitch: 'SOL' }],
      explanation: {
        goal: "Sperimentare l'intervallo di quinta giusta tra Do e Sol come base armonica.",
        howToCount: "Basso: Metà 2/4 su Do, Metà 2/4 su Sol. Melodia: 4 Quarti 1/4 (Mi, Fa, Sol, Mi).",
        hint: "Questo accompagnamento è tipico delle cornamuse e degli strumenti antichi."
      }
    },
    {
      title: "Ostinato Ritmico-Melodico",
      desc: "La seconda voce ripete un piccolo disegno costante mentre la prima canta.",
      polyphonyTracks: 2,
      notesTrack1: [{ step: 0, duration: 4, pitch: 'DO_HIGH' }, { step: 4, duration: 4, pitch: 'SI' }, { step: 8, duration: 8, pitch: 'DO_HIGH' }],
      notesTrack2: [{ step: 0, duration: 4, pitch: 'DO' }, { step: 4, duration: 4, pitch: 'SOL' }, { step: 8, duration: 4, pitch: 'DO' }, { step: 12, duration: 4, pitch: 'SOL' }],
      explanation: {
        goal: "Capire il concetto di 'Ostinato': una formula breve che si ripete senza cambiare mai.",
        howToCount: "Ostinato (Voce 2): 'Do, Sol, Do, Sol'. Melodia (Voce 1): 'Do acuto, Si, Do lungo'.",
        hint: "Ascolta la versione modello: l'ostinato crea un treno inarrestabile che spinge la melodia."
      }
    },
    {
      title: "Introduzione al Canone",
      desc: "La magia del canone: la stessa frase musicale cantata a staffetta da due gruppi!",
      polyphonyTracks: 2,
      notesTrack1: [{ step: 0, duration: 4, pitch: 'DO' }, { step: 4, duration: 4, pitch: 'RE' }, { step: 8, duration: 4, pitch: 'MI' }, { step: 12, duration: 4, pitch: 'DO' }],
      notesTrack2: [{ step: 0, duration: 8, isRest: true }, { step: 8, duration: 4, pitch: 'DO' }, { step: 12, duration: 4, pitch: 'RE' }],
      explanation: {
        goal: "Imparare il meccanismo del Canone: la voce 2 parte con due tempi di ritardo ripetendo le stesse note della voce 1.",
        howToCount: "Voce 1 parte sul tempo 1: 'Do, Re, Mi, Do'. Voce 2 aspetta 2 tempi e poi parte sul tempo 3: 'Do, Re...'.",
        hint: "Premi 'Ascolta Versione Corretta' per sentire come le note si inseguono senza scontrarsi mai!"
      }
    },
    {
      title: "Fra Martino Campanaro (Parte 1)",
      desc: "Il canone più amato al mondo a due voci alternate.",
      polyphonyTracks: 2,
      bars: 2,
      notesTrack1: [{ step: 0, duration: 4, pitch: 'DO' }, { step: 4, duration: 4, pitch: 'RE' }, { step: 8, duration: 4, pitch: 'MI' }, { step: 12, duration: 4, pitch: 'DO' }, { step: 16, duration: 4, pitch: 'MI' }, { step: 20, duration: 4, pitch: 'FA' }, { step: 24, duration: 8, pitch: 'SOL' }],
      notesTrack2: [{ step: 0, duration: 16, isRest: true }, { step: 16, duration: 4, pitch: 'DO' }, { step: 20, duration: 4, pitch: 'RE' }, { step: 24, duration: 4, pitch: 'MI' }, { step: 28, duration: 4, pitch: 'DO' }],
      explanation: {
        goal: "Eseguire la prima metà di Fra Martino Campanaro in vero canone a 2 voci differite di 1 battuta ($4$ tempi).",
        howToCount: "Voce 1 canta: 'Fra Mar-ti-no cam-pa-na-ro...'. Quando Voce 1 arriva alla seconda battuta, Voce 2 attacca dall'inizio!",
        hint: "Ascolta la versione corretta: è una delle esperienze polifoniche più emozionanti per i bambini."
      }
    },
    {
      title: "Fra Martino Campanaro (Parte 2)",
      desc: "Le campane suonano: Din-Don-Dan in armonia polifonica.",
      polyphonyTracks: 2,
      bars: 2,
      notesTrack1: [{ step: 0, duration: 4, pitch: 'SOL' }, { step: 4, duration: 4, pitch: 'LA' }, { step: 8, duration: 8, pitch: 'SOL' }, { step: 16, duration: 4, pitch: 'DO' }, { step: 20, duration: 4, pitch: 'SOL' }, { step: 24, duration: 8, pitch: 'DO' }],
      notesTrack2: [{ step: 0, duration: 4, pitch: 'MI' }, { step: 4, duration: 4, pitch: 'FA' }, { step: 8, duration: 8, pitch: 'SOL' }, { step: 16, duration: 4, pitch: 'SOL' }, { step: 20, duration: 4, pitch: 'LA' }, { step: 24, duration: 8, pitch: 'SOL' }],
      explanation: {
        goal: "Completare Fra Martino con la sezione delle campane che suonano a festa.",
        howToCount: "Voce 1: 'Suo-na le cam-pa-ne... Din Don Dan!'. Voce 2 crea l'intreccio armonico.",
        hint: "Ascolta come il Do basso e il Do alto risuonano insieme alla fine."
      }
    },
    {
      title: "Dettato Armonico a Due Voci",
      desc: "Ascolta le due voci sovrapposte e individua se la voce superiore sale o scende.",
      polyphonyTracks: 2,
      notesTrack1: [{ step: 0, duration: 8, pitch: 'SOL' }, { step: 8, duration: 8, pitch: 'LA' }],
      notesTrack2: [{ step: 0, duration: 16, pitch: 'DO' }],
      explanation: {
        goal: "Sviluppare l'ascolto selettivo polifonico: isolare con l'orecchio la melodia acuta dal basso.",
        howToCount: "Focalizza l'attenzione sulla nota più acuta: sale da Sol a La.",
        hint: "Usa 'Ascolta Versione Corretta' e canta la nota più alta."
      }
    },
    {
      title: "Componi a Due Voci",
      desc: "Inserisci la voce superiore sopra l'ostinato inferiore preparato.",
      polyphonyTracks: 2,
      notesTrack1: [{ step: 0, duration: 4, pitch: 'MI' }, { step: 4, duration: 4, pitch: 'SOL' }, { step: 8, duration: 8, pitch: 'DO_HIGH' }],
      notesTrack2: [{ step: 0, duration: 4, pitch: 'DO' }, { step: 4, duration: 4, pitch: 'DO' }, { step: 8, duration: 8, pitch: 'DO' }],
      explanation: {
        goal: "Scrivere una melodia sul rigo 1 mentre il rigo 2 mantiene la pulsazione sul Do fondamentale.",
        howToCount: "Conta i 4 quarti e armonizza Mi (terza) e Sol (quinta) sopra il Do.",
        hint: "Confronta la tua creazione con 'Ascolta Versione Corretta'."
      }
    }
  ];

  mod4Data.forEach((lvl, idx) => {
    levels.push({
      id: `M${idx + 25}`,
      globalId: 48 + idx + 25,
      section: 'melody',
      areaNumber: 4,
      areaTitle: "Modulo 4: Indipendenza e Polifonia (2 Righi, Canone e Bordone)",
      title: lvl.title,
      description: lvl.desc,
      explanation: lvl.explanation,
      type: idx === 7 ? 'build' : 'tap',
      bpm: 85,
      timeSignature: '4/4',
      staffType: 'dual',
      polyphonyTracks: 2,
      bars: lvl.bars || 1,
      totalSteps: (lvl.bars || 1) * 16,
      allowedFigures: ['whole', 'half', 'quarter', 'eighth', 'rest_quarter'],
      allowedPitches: ['DO', 'RE', 'MI', 'FA', 'SOL', 'LA', 'SI', 'DO_HIGH'],
      targetNotes: lvl.notesTrack1,
      targetNotesTrack2: lvl.notesTrack2,
    });
  });

  // MODULO 5: Espressione, Modi e Alterazioni (33-40) - Modo Maggiore vs Minore, Diesis (#) e Bemolle (b)
  const mod5Data = [
    {
      title: "Luce e Ombra (Maggiore vs Minore)",
      desc: "Scopri come la terza minore cambia l'umore della musica da felice a pensieroso.",
      notes: [{ step: 0, duration: 4, pitch: 'LA' }, { step: 4, duration: 4, pitch: 'DO_HIGH' }, { step: 8, duration: 4, pitch: 'MI' }, { step: 12, duration: 4, pitch: 'LA' }],
      explanation: {
        goal: "Percepire la differenza emotiva tra il modo Maggiore (luminoso, gioioso) e il modo Minore (intimo, malinconico).",
        howToCount: "Canta l'arpeggio minore: La -> Do acuto -> Mi -> La.",
        hint: "Ascolta come l'intervallo tra La e Do suona più dolce e riflessivo rispetto a Do-Mi."
      }
    },
    {
      title: "La Magia del Diesis (#)",
      desc: "Il Diesis (♯) alza la nota di mezzo gradino: scopri il Fa♯ e la sua luminosità brillante.",
      accidentalsEnabled: true,
      notes: [{ step: 0, duration: 4, pitch: 'SOL' }, { step: 4, duration: 4, pitch: 'FA', accidental: 1 }, { step: 8, duration: 4, pitch: 'SOL' }, { step: 12, duration: 4, pitch: 'RE' }],
      explanation: {
        goal: "Imparare il simbolo del Diesis (♯): alza l'altezza della nota di un semitono esatto.",
        howToCount: "Canta: 'Sol -> Fa diesis (più alto del Fa normale) -> Sol -> Re'.",
        hint: "Il Fa♯ suona quasi come un Sol, creando un'attrazione irresistibile verso l'alto."
      }
    },
    {
      title: "La Dolcezza del Bemolle (b)",
      desc: "Il Bemolle (♭) abbassa la nota di mezzo gradino: scopri il Si♭ morbido e vellutato.",
      accidentalsEnabled: true,
      notes: [{ step: 0, duration: 4, pitch: 'FA' }, { step: 4, duration: 4, pitch: 'LA' }, { step: 8, duration: 4, pitch: 'SI', accidental: -1 }, { step: 12, duration: 4, pitch: 'DO_HIGH' }],
      explanation: {
        goal: "Imparare il simbolo del Bemolle (♭): abbassa l'altezza della nota di un semitono esatto.",
        howToCount: "Canta: 'Fa -> La -> Si bemolle (più scuro e morbido del Si) -> Do acuto'.",
        hint: "Il Si♭ ammorbidisce la melodia dandole un calore vellutato."
      }
    },
    {
      title: "Danza Ungherese con Alterazioni",
      desc: "Un motivo vivace in stile gitano con note alterate (Sol♯).",
      accidentalsEnabled: true,
      notes: [{ step: 0, duration: 2, pitch: 'LA' }, { step: 2, duration: 2, pitch: 'DO_HIGH' }, { step: 4, duration: 4, pitch: 'SI' }, { step: 8, duration: 2, pitch: 'SOL', accidental: 1 }, { step: 10, duration: 2, pitch: 'LA' }, { step: 12, duration: 4, pitch: 'LA' }],
      explanation: {
        goal: "Eseguire la scala minore armonica con la presenza del Sol♯.",
        howToCount: "Canta: 'La-Do (Ti-Ti), Si (Ta), Sol#-La (Ti-Ti), La (Ta)'.",
        hint: "Ascolta la versione corretta: riconoscerai lo stile inconfondibile delle danze popolari dell'est Europa."
      }
    },
    {
      title: "Trascina l'Alterazione",
      desc: "Prendi il simbolo ♯ o ♭ dalla tavolozza e applicalo alla nota per colorare la melodia.",
      accidentalsEnabled: true,
      type: 'build',
      notes: [{ step: 0, duration: 4, pitch: 'SOL' }, { step: 4, duration: 4, pitch: 'FA', accidental: 1 }, { step: 8, duration: 8, pitch: 'SOL' }],
      explanation: {
        goal: "Esercizio pratico: selezionare il Diesis (♯) e applicarlo sul Fa per creare il semitono sensibile.",
        howToCount: "Sol -> Fa# -> Sol-ol.",
        hint: "Seleziona il pulsante '♯ Diesis' prima di inserire la nota oppure clicca sulla nota per alterarla."
      }
    },
    {
      title: "Dettato Espressivo: Chi sorride e chi medita?",
      desc: "Ascolta due brevi frasi ed identifica quella in modo Minore.",
      type: 'dictation',
      bpm: 80,
      notes: [{ step: 0, duration: 4, pitch: 'LA' }, { step: 4, duration: 4, pitch: 'DO_HIGH' }, { step: 8, duration: 8, pitch: 'MI' }],
      options: [
        { id: 'optA', label: "Modo Maggiore (Luminoso e festoso)", isCorrect: false },
        { id: 'optB', label: "Modo Minore (Intimo, dolce e riflessivo)", isCorrect: true }
      ],
      explanation: {
        goal: "Educare la sensibilità emotiva musicale riconoscendo il modo Minore.",
        howToCount: "Ascolta la terza iniziale tra La e Do acuto.",
        hint: "La musica in modo minore sembra raccontare un segreto o una storia del passato."
      }
    },
    {
      title: "Preludio a Due Voci con Alterazioni",
      desc: "Brano completo a due voci con il Fa♯ nella melodia superiore.",
      polyphonyTracks: 2,
      accidentalsEnabled: true,
      notesTrack1: [{ step: 0, duration: 4, pitch: 'SOL' }, { step: 4, duration: 4, pitch: 'FA', accidental: 1 }, { step: 8, duration: 4, pitch: 'SOL' }, { step: 12, duration: 4, pitch: 'DO_HIGH' }],
      notesTrack2: [{ step: 0, duration: 8, pitch: 'DO' }, { step: 8, duration: 8, pitch: 'SOL' }],
      explanation: {
        goal: "Fondere polifonia a 2 voci e note alterate in un preludio classico.",
        howToCount: "Basso suona Do e Sol in Metà 2/4; melodia esegue Sol, Fa#, Sol, Do acuto.",
        hint: "Ascolta il modello d'autore con 'Ascolta Versione Corretta' per assaporare l'eleganza dell'armonia."
      }
    },
    {
      title: "Capolavoro Finale: Composizione a Due Voci (8 Battute)",
      desc: "Il compimento del percorso didattico: componi liberamente un'opera polifonica completa a due voci su 8 battute!",
      type: 'compose',
      bars: 8,
      totalSteps: 128,
      polyphonyTracks: 2,
      staffType: 'dual',
      accidentalsEnabled: true,
      bpm: 90,
      allowedFigures: ['whole', 'half', 'quarter', 'eighth', 'sixteenth', 'rest_quarter', 'rest_eighth'],
      allowedPitches: ['DO', 'RE', 'MI', 'FA', 'SOL', 'LA', 'SI', 'DO_HIGH'],
      notesTrack1: [
        { step: 0, duration: 4, pitch: 'DO' }, { step: 4, duration: 4, pitch: 'MI' }, { step: 8, duration: 4, pitch: 'SOL' }, { step: 12, duration: 4, pitch: 'DO_HIGH' },
        { step: 16, duration: 4, pitch: 'SI' }, { step: 20, duration: 4, pitch: 'LA' }, { step: 24, duration: 8, pitch: 'SOL' },
        { step: 32, duration: 4, pitch: 'FA', accidental: 1 }, { step: 36, duration: 4, pitch: 'SOL' }, { step: 40, duration: 4, pitch: 'LA' }, { step: 44, duration: 4, pitch: 'SI' },
        { step: 48, duration: 16, pitch: 'DO_HIGH' },
        { step: 64, duration: 4, pitch: 'MI' }, { step: 68, duration: 4, pitch: 'FA' }, { step: 72, duration: 4, pitch: 'SOL' }, { step: 76, duration: 4, pitch: 'MI' },
        { step: 80, duration: 4, pitch: 'RE' }, { step: 84, duration: 4, pitch: 'MI' }, { step: 88, duration: 8, pitch: 'DO' },
        { step: 96, duration: 4, pitch: 'SOL' }, { step: 100, duration: 4, pitch: 'LA' }, { step: 104, duration: 4, pitch: 'SI' }, { step: 108, duration: 4, pitch: 'DO_HIGH' },
        { step: 112, duration: 16, pitch: 'DO_HIGH' }
      ],
      notesTrack2: [
        { step: 0, duration: 16, pitch: 'DO' },
        { step: 16, duration: 8, pitch: 'SOL' }, { step: 24, duration: 8, pitch: 'DO' },
        { step: 32, duration: 16, pitch: 'RE' },
        { step: 48, duration: 16, pitch: 'SOL' },
        { step: 64, duration: 16, pitch: 'DO' },
        { step: 80, duration: 8, pitch: 'SOL' }, { step: 88, duration: 8, pitch: 'DO' },
        { step: 96, duration: 16, pitch: 'FA' },
        { step: 112, duration: 16, pitch: 'DO' }
      ],
      explanation: {
        goal: "La grande prova d'orchestra finale! Componi o esplora un'opera su 8 battute piene con due voci indipendenti, alterazioni e ricchezza ritmica.",
        howToCount: "Segui le 8 battute complete (128 sedicesimi): un vero viaggio compositivo da maestro.",
        hint: "Clicca su 'Ascolta Versione Corretta' per goderti l'intera sinfonia di fine anno composta per te!"
      }
    }
  ];

  mod5Data.forEach((lvl, idx) => {
    levels.push({
      id: `M${idx + 33}`,
      globalId: 48 + idx + 33,
      section: 'melody',
      areaNumber: 5,
      areaTitle: "Modulo 5: Espressione, Modi e Alterazioni (♯ / ♭)",
      title: lvl.title,
      description: lvl.desc,
      explanation: lvl.explanation,
      type: lvl.type || 'tap',
      bpm: lvl.bpm || 86,
      timeSignature: '4/4',
      staffType: lvl.staffType || 'pentagram',
      polyphonyTracks: lvl.polyphonyTracks || 1,
      bars: lvl.bars || 1,
      totalSteps: (lvl.bars || 1) * 16,
      allowedFigures: lvl.allowedFigures || ['whole', 'half', 'quarter', 'eighth'],
      allowedPitches: lvl.allowedPitches || ['DO', 'RE', 'MI', 'FA', 'SOL', 'LA', 'SI', 'DO_HIGH'],
      accidentalsEnabled: lvl.accidentalsEnabled || false,
      chironomyEnabled: true,
      targetNotes: lvl.notesTrack1 || lvl.notes,
      targetNotesTrack2: lvl.notesTrack2 || null,
      options: lvl.options || null,
    });
  });

  return levels;
}

export const RHYTHMIC_LEVELS = generateRhythmicCurriculum();
export const MELODIC_LEVELS = generateMelodicCurriculum();
export const ALL_LEVELS = [...RHYTHMIC_LEVELS, ...MELODIC_LEVELS];
