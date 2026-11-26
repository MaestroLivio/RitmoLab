# RitmoLab · Laboratorio musicale

RitmoLab è un'app desktop offline per la scuola primaria. Riunisce un editor di partiture, la body percussion, lo strumentario Orff e la solmisazione Kodály in **88 livelli**: 48 ritmici e 40 melodici.

## Scarica e installa

| Sistema | Installer 1.2.1 |
| --- | --- |
| **Windows 10/11 x64** | [RitmoLab-1.2.1-Windows-x64.exe](https://github.com/MaestroLivio/RitmoLab/releases/download/v1.2.1/RitmoLab-1.2.1-Windows-x64.exe) |
| **macOS 12 o successivo, Apple Silicon** | [RitmoLab-1.2.1-macOS-arm64.dmg](https://github.com/MaestroLivio/RitmoLab/releases/download/v1.2.1/RitmoLab-1.2.1-macOS-arm64.dmg) |

Dalla 1.2, la [release corrente](https://github.com/MaestroLivio/RitmoLab/releases/latest) contiene solo questi due installer. Le versioni Intel, Linux, ChromeOS, portable e HTML non sono più prodotte. Le vecchie release restano consultabili.

Gli installer includono l'app, i campioni e i caratteri musicali. Per installare, lavorare e riprodurre i suoni non serve Internet. Il controllo degli aggiornamenti usa GitHub quando è disponibile una connessione. Consulta le [istruzioni di installazione](installers/LEGGIMI.txt) per gli eventuali avvisi del sistema.

## Scrivi e ascolta una partitura

1. Apri **Laboratorio libero → Strumenti**. Scegli ritmo o melodia; per la melodia puoi usare il pentagramma, il bigramma, il trigramma o il doppio rigo.
2. Scegli **Blocchi** per lavorare con le durate proporzionali oppure **Notazione** per modificare il rigo con figure convenzionali. Usa il menu del metro per cambiare tra 2/4, 3/4, 4/4 e 6/8.
3. Scegli una nota o una pausa nella tavolozza e fai clic sul rigo. Seleziona una figura già inserita per cambiarne la durata o l'alterazione. Nel laboratorio puoi usare anche il punto di valore; i valori inferiori al sedicesimo non sono previsti.
4. Trascina per spostare la figura. Da tastiera: **Tab** porta al rigo, **frecce** spostano il cursore, **Invio** inserisce, **Maiusc + frecce** sposta la figura selezionata e **Canc** la elimina. Le frecce sopra l'editor annullano e ripristinano; dal rigo funzionano anche **Ctrl/⌘+Z** e **Ctrl/⌘+Maiusc+Z**.
5. Premi **Ascolta**. Le crome e semicrome consecutive si raggruppano per pulsazione; le note che oltrepassano una battuta sono mostrate con una legatura. Il rigo doppio permette di inserire e riprodurre due voci. Nel laboratorio **I miei brani** salva e richiama il lavoro.

La partitura si adatta alla larghezza della finestra. Usa le frecce o il menu **Battute** per cambiare pagina: durante l’ascolto, la pagina segue automaticamente la musica. Nelle finestre basse, il doppio rigo mostra una voce alla volta in modalità **Auto**; con **Voci** puoi scegliere quale mostrare oppure visualizzarle entrambe. La riproduzione non cambia.

L’interfaccia si adatta da 540×420 fino a schermi 1920×1080. Con la finestra bassa, i comandi secondari si raccolgono sotto **Strumenti** e **Verifica**; l’elenco dei livelli si organizza per aree e le finestre di dialogo restano interamente raggiungibili. Le tre dimensioni del testo in **Impostazioni** usano il ridimensionamento del sistema: a 130% note, righi e comandi crescono insieme senza tagliare contenuti.

L'editor è pensato per lo studio: non sostituisce un programma di impaginazione professionale e non esporta MusicXML, MIDI o PDF.

## Esercitati

- **Esegui il ritmo:** usa il tasto spazio oppure i tasti e i pulsanti delle singole percussioni. Per la melodia usa i tasti sullo schermo, la tastiera del computer, una periferica MIDI USB o la modalità **Canto**. I livelli con alterazioni offrono anche i controlli ♮, ♯ e ♭.
- **Conta e suona:** il metronomo dà una battuta di preparazione. Il primo numero compare al primo clic, e il brano entra subito dopo l'ultimo. In 6/8 si contano due pulsazioni da tre crome, mentre i BPM continuano a riferirsi alla semiminima.
- **Accompagnamento MIDI:** la base usa batteria campionata negli esercizi ritmici e basso e pianoforte negli esercizi melodici, senza richiedere una periferica esterna. Disattivala nella scheda prima di iniziare: il metronomo rimane attivo. In modalità **Canto**, usa le cuffie per limitare il rientro dell'audio nel microfono.
- **Dettato:** ascolta la battuta di preparazione e il brano, poi scegli la risposta. Puoi riascoltare o interrompere quando vuoi. La base non viene sovrapposta al dettato.
- **Risultati:** il giudizio indica precisione, anticipo o ritardo; la tolleranza è configurabile in **Impostazioni**. Se il sistema richiede movimento ridotto, l'esercizio mostra la figura in arrivo senza scorrimento continuo.

Nel **Percorso didattico → Strumenti docente** puoi sbloccare i livelli per una dimostrazione, importare o esportare i progressi in JSON e azzerare il profilo.

## Suoni e licenze

L'app riproduce **39 campioni locali** ricavati dalla banca FluidR3 GM: xilofono, glockenspiel, flauto dolce, pianoforte, basso, percussioni e metronomo. Non usa oscillatori o rumore generato per i timbri. Mani usa un campione di battito di mani; Petto, Cosce, Piedi e Dita sono rappresentati da campioni percussivi analoghi, non da registrazioni di quei gesti. Il font musicale Bravura è incluso.

- RitmoLab: [CC BY 4.0](LICENSE), attribuzione a [MaestroLivio](https://github.com/MaestroLivio).
- Campioni FluidR3 GM: [licenza MIT e attribuzione](public/samples/LICENSE.txt).
- Bravura: [SIL Open Font License 1.1](public/fonts/OFL-Bravura.txt).

## Sviluppo e release

Usa Node.js 22 LTS:

```bash
npm ci
npm test
npm run dev
npm run electron:dev
npm run build
```

Su una macchina del sistema di destinazione, `npm run electron:build -- macos` crea il DMG Apple Silicon, mentre `npm run electron:build -- windows` crea l'installer NSIS x64. I file finiscono rispettivamente in `installers/macOS/` e `installers/Windows/`.

Per pubblicare una nuova versione, aggiorna la versione in `package.json` e nel lockfile, porta le modifiche su `main` e avvia **Actions → Release RitmoLab → Run workflow**. Il workflow esegue i test su entrambe le piattaforme e pubblica soltanto i due installer quando le build hanno avuto successo.

`src/engine/Transport.js` gestisce tempo, metro e armonizzazione; `AudioEngine.js` carica e programma i campioni. La visualizzazione convenzionale è in `src/components/ScoreEngraving.jsx`. Per rigenerare i soli campioni dal soundfont originale, vedi [`scripts/render-samples.py`](scripts/render-samples.py).
