# 🎵 RitmoLab - Laboratorio Desktop per l'Educazione Musicale

**RitmoLab** è un'applicazione desktop standalone completa ed offline per l'insegnamento e l'apprendimento della musica nella **Scuola Primaria**. Unisce la **Body Percussion**, lo **Strumentario Orff** e la **Solmisazione relativa con Chironomia (Metodo Kodály)** attraverso un editor musicale ibrido (DAW + Notazione convenzionale) e un percorso curricolare progressivo di **88 livelli didattici**.

---

## 🌟 Caratteristiche Principali

### 1. Workspace Ibrido DAW + Notazione Musicale
- **Nomenclatura Musicale Ufficiale**:
  - `Intero 4/4` (4 battiti, 16 sedicesimi, 𝅝)
  - `Metà 2/4` (2 battiti, 8 sedicesimi, 𝅗𝅥)
  - `Quarto 1/4` (1 battito, 4 sedicesimi, ♩)
  - `Ottavo 1/8` (1/2 battito, 2 sedicesimi, ♪)
  - `Sedicesimo 1/16` (1/4 battito, 1 sedicesimo, ♬)
- **Doppia Visualizzazione Istantanea**:
  - **Blocchi Proporzionali (Montessori)**: la larghezza grafica di ogni tessera rispecchia la sua durata matematica (Intero 4/4 = 16 sedicesimi, Metà 2/4 = 8, Quarto 1/4 = 4, Ottavo 1/8 = 2, Sedicesimo 1/16 = 1).
  - **Notazione Convenzionale**: rendering vettoriale accurato di teste di nota (piene e vuote), gambi, bandierine singole e doppie (𝅝, 𝅗𝅥, ♩, ♪, ♬), tagli addizionali (es. Do centrale) e pause (𝄽, 𝄾).
- **Laboratorio Libero (DAW Completo)**:
  - **Tablatura Ritmica**: griglia multitraccia per Body Percussion (Mani, Dita, Petto, Cosce, Piedi) e Strumentario Orff (Legnetti, Tamburello, Triangolo, Piatti).
  - **Rigo Melodico**: selezione tra Pentagramma (5 linee), Trigramma (3 linee), Bigramma (2 linee) o Doppio Rigo.
  - Selezione estensione battute: 1, 2, 4 o 8 battute.
- **Spiegazione Didattica e Ascolto della Versione Corretta**:
  - In ogni esercizio del percorso didattico è presente un pannello interattivo con l'**Obiettivo Didattico**, la **Guida Vocale (Come contare con sillabe Kodály)** e il pulsante **"Ascolta Versione Corretta"** per ascoltare la partitura modello in qualsiasi momento.
- **Drag & Drop Bidimensionale**:
  - **Asse X (Tempo)**: ancoraggio magnetico a griglia di sedicesimi (1/16) con linee di battuta e suddivisione dei quarti.
  - **Asse Y (Altezza/Pitch o Strumento)**: ancoraggio dinamico sulle linee e negli spazi del rigo musicale o sulle tracce di Body Percussion.
- **Playhead Fluido**: linea rossa con indicatore luminoso che scorre a 60 FPS sincronizzata con l'audio.
- **Diagramma a Torta Animato (Ciclo del 4/4)**: pie-chart a 4 fette colorate Montessori che si riempiono in tempo reale al battere di ogni quarto, mostrando la frazione matematica e verificando se la battuta è completa ($16/16 = 4/4$).

---

### 2. Motore Audio (Sintesi Procedurale Web Audio API Pura)
Nessun file audio `.mp3` o `.wav` esterno. Tutta la sintesi è generata in tempo reale via codice:
- **Body Percussion**:
  - **Mani (Clap)**: rumore bianco filtrato passa-banda corto + snap.
  - **Petto (Chest)**: sine sweep discendente a bassa frequenza ($150 \rightarrow 50\text{ Hz}$).
  - **Cosce (Thighs)**: sine sweep medio con transiente slap attenuato.
  - **Piedi (Feet/Stomp)**: kick drum profondo e percussivo ($100 \rightarrow 35\text{ Hz}$).
  - **Dita (Snap)**: click acuto con cinguettio ad alta frequenza.
- **Strumentario Orff**:
  - **Legnetti (Claves)**: doppio oscillatore sinusoidale risonante ($2200\text{ Hz}$ e $2780\text{ Hz}$) a decadimento rapido.
  - **Tamburello**: percussione a membrana combinata con tintinnio metallico modulato.
  - **Triangolo**: 4 oscillatori sinusoidali disarmonici detunati con riverbero metallico prolungato ($>1.2\text{ s}$).
  - **Piatti (Cymbals)**: rumore bianco passa-alto con inviluppo esponenziale lungo.
- **Sintesi Melodica & Inviluppo ADSR Dinamico**:
  - Timbri selezionabili: **Xilofono/Metallofono Orff**, **Glockenspiel**, **Flauto Dolce**.
  - Durata dinamica: una minima o semibreve risuona più a lungo di una croma o semicroma.
  - Supporto per **Diesis ($\sharp$)** e **Bemolle ($\flat$)**.

---

### 3. Modalità "Esegui il Ritmo" (RhythmEvaluator Engine)
- Valutazione in tempo reale della pressione della **Barra Spaziatrice** o del pulsante su schermo.
- Calcolo esatto dei millisecondi teorici in base ai BPM e alla notazione.
- Finestre di tolleranza didattica:
  - $\pm 80\text{ ms}$: **"Perfetto"** ⭐ (+100 punti)
  - $\pm 165\text{ ms}$: **"Impreciso"** 👍 (+60 punti, con indicatore di anticipo/ritardo)
  - Oltre finestra o non suonato: **"Mancato"** ❌
- Conteggio combo, stelle (da 1 a 3), percentuale di accuratezza e coriandoli festosi (*confetti*) al completamento!

---

### 4. Il Percorso Didattico (88 Livelli Totali)

#### PARTE A: RITMO E BODY PERCUSSION (48 Livelli)
1. **Area 1 (Livelli 1-8)**: *Scoprire il ritmo* — Solo Mani (Clap). Semibreve ($4/4$), Minima ($2/4$), Semiminima ($1/4$). La Marcia degli Orsetti.
2. **Area 2 (Livelli 9-16)**: *Entrano gli ottavi* — Coppie di ottavi (Ti-Ti) e ritmi misti. Saltarello.
3. **Area 3 (Livelli 17-24)**: *Entrano i sedicesimi* — Quartine di sedicesimi (Tiri-Tiri), combinazioni rapide, Groove Sincopato.
4. **Area 4 (Livelli 25-30)**: *Le prime parti del corpo* — Introduzione di Cosce e Piedi associati a colori differenziati.
5. **Area 5 (Livelli 31-36)**: *Coordinazione Corporea Totale* — 4 azioni integrate: Clap, Cosce, Piedi, Dita.
6. **Area 6 (Livelli 37-42)**: *Complessità, Pause e Tamburo del Petto* — Pause di semiminima (𝄽) e di croma (𝄾), percussione sul Petto.
7. **Area 7 (Livelli 43-45)**: *Ascolto e Riconoscimento* — Dettati ritmici a scelta multipla e ricostruzione ad orecchio.
8. **Area 8 (Livelli 46-48)**: *Composizione e Matematica Musicale* — Verifica della quadratura $4/4$ e gran concerto finale.

#### PARTE B: MELODIA E SOLMISAZIONE (40 Livelli)
1. **Modulo 1 (Livelli 1-8)**: *Il Nucleo Infantile* — Bigramma (2 linee). Note Sol, Mi e La. Chironomia Kodály (segni delle mani). Sinfonia dei Giocattoli e ninne nanne.
2. **Modulo 2 (Livelli 9-16)**: *La Scala Pentatonica* — Trigramma (3 linee). Aggiunta di Do e Re (Do-Re-Mi-Sol-La). Spirituals e canti folk. Dettato pentatonico.
3. **Modulo 3 (Livelli 17-24)**: *Il Pentagramma Diatonico* — Pentagramma a 5 linee con Chiave di Violino. Introduzione dei semitoni naturali Fa e Si. Inno alla Gioia, La Primavera di Vivaldi.
4. **Modulo 4 (Livelli 25-32)**: *Indipendenza e Polifonia* — Doppio rigo musicale. Bordone (ostinato) + Melodia. Il Canone (Fra Martino a due voci differite). Dettato armonico.
5. **Modulo 5 (Livelli 33-40)**: *Espressione, Modi e Alterazioni* — Percezione del Modo Maggiore vs Minore. Trascinamento di Diesis ($\sharp$) e Bemolle ($\flat$). Livello 40: Composizione polifonica libera a 2 voci su 8 battute.

---

## 🚀 Istruzioni di Avvio e Comandi

### Prerequisiti
- **Node.js** versione 18 o superiore (consigliata v20+ o v22 LTS).
- **npm** (incluso con Node.js).

### 1. Installazione Dipendenze
Apri il terminale nella cartella del progetto ed esegui:
```bash
npm install
```

### 2. Avvio in Modalità Browser (Sviluppo Rapido)
Avvia il server di sviluppo Vite:
```bash
npm run dev
```
Apri il browser su [http://localhost:5173](http://localhost:5173).

### 3. Avvio in Modalità Applicazione Desktop Standalone (Electron)
Per avviare la finestra nativa desktop su macOS / Windows / Linux:
```bash
npm run electron:dev
```

### 4. Build per la Produzione
Per compilare i file ottimizzati per l'offline:
```bash
npm run build
```
I file compilati saranno salvati nella cartella `dist/`.

Per visualizzare l'anteprima del build di produzione:
```bash
npm run preview
```

### 5. Esecuzione Test Automatici
Per verificare l'integrità del curriculum a 88 livelli, la precisione in millisecondi del `RhythmEvaluator` e la persistenza:
```bash
node src/tests/curriculum-evaluator.test.js
```

---

## 📂 Architettura del Progetto

```text
├── electron/
│   ├── main.cjs            # Processo principale Electron (finestra desktop standalone)
│   └── preload.cjs         # Preload script per isolamento di contesto sicuro
├── src/
│   ├── engine/
│   │   ├── AudioEngine.js      # Sintesi procedurale Web Audio API (Body, Orff, Melodia)
│   │   ├── RhythmEvaluator.js  # Motore di valutazione tempo reale con tolleranza ms
│   │   └── LevelManager.js     # Gestione sblocco, progressi, stelle e salvataggio JSON
│   ├── data/
│   │   └── curriculum.js       # Configurazione completa degli 88 livelli didattici
│   ├── components/
│   │   ├── GridEditor.jsx      # Workspace ibrido con Drag & Drop X/Y e snap 1/16
│   │   ├── NoteRenderer.jsx    # Visualizzazione Blocchi Proporzionali e Notazione
│   │   ├── StaffRenderer.jsx   # Bigramma, Trigramma, Pentagramma e tracce Body
│   │   ├── PieCycleChart.jsx   # Diagramma a torta animato a 4 fette per il 4/4
│   │   ├── RhythmTapGame.jsx   # Esercizio Rhythm Tap con barra spaziatrice e score
│   │   ├── DictationGame.jsx   # Gioco del dettato melodico e ritmico ad orecchio
│   │   ├── LevelSelector.jsx   # Griglia degli 88 livelli con filtri e strumenti docente
│   │   └── InstrumentariumModal.jsx # Soundboard interattiva dello strumentario Orff
│   ├── App.jsx             # Shell principale dell'applicazione e navigazione
│   ├── main.jsx            # Entrypoint React
│   └── index.css           # Styling TailwindCSS con colori pastello Montessori
├── index.html              # HTML con font accessibili (Fredoka, Quicksand)
├── tailwind.config.js      # Palette colori Montessori, Solfeggio Kodály e Body Percussion
├── vite.config.js          # Configurazione Vite con percorsi relativi per offline
└── package.json            # Dipendenze e script npm
```

---

## 👩‍🏫 Strumenti per il Docente
Nel pannello **Percorso Didattico** è presente il pulsante **Strumenti Docente**:
1. **Sblocca Tutti i Livelli**: consente all'insegnante di accedere immediatamente a qualunque livello per dimostrazioni in classe o proiezioni su LIM.
2. **Esporta Progressi (JSON)**: scarica un file `.json` con lo storico, i punteggi e le composizioni degli allievi.
3. **Importa Progressi**: consente di caricare il profilo di un alunno da un file salvato in precedenza.
4. **Azzera Progressi**: per preparare l'applicazione per una nuova classe o un nuovo anno scolastico.

---

## 📄 Licenza
Rilasciato sotto licenza MIT. Ideato per docenti ed educatori musicali della Scuola Primaria.
