# RitmoLab su ChromeOS e Android

RitmoLab usa lo stesso renderer web per l'app Electron, la **Progressive Web App (PWA)** installabile da Chrome e il wrapper Android nativo. ChromeOS può installare la PWA; Android può usare la PWA oppure l'APK offline.

## Pubblicazione

Pubblicare il contenuto di `dist/` su un hosting HTTPS, mantenendo `manifest.webmanifest`, `sw.js`, `icons/`, `assets/`, `samples/` e `fonts/` ai percorsi relativi previsti. Il service worker memorizza l'app shell e mette in cache risorse audio/font quando vengono usate. La prima apertura richiede una connessione; gli aggiornamenti arrivano quando il dispositivo torna online.

## Installazione

- **ChromeOS:** aprire l'indirizzo HTTPS con Chrome e usare **Installa RitmoLab** dalla barra degli indirizzi o dal menu.
- **Android:** aprire lo stesso indirizzo in Chrome e scegliere **Installa app** oppure **Aggiungi a schermata Home**.

In entrambi i casi l'app si avvia in una finestra dedicata. Progressi e impostazioni sono conservati nell'archivio locale del browser e non vengono sincronizzati automaticamente fra dispositivi.

## APK Android

Il progetto contiene anche un wrapper Android nativo con i contenuti web e audio inclusi localmente. Costruiscilo con:

```sh
npm run android:build
```

L'APK debug installabile viene creato in `installers/Android/`. Supporta telefoni e tablet in orientamento verticale/orizzontale e usa le aree sicure del sistema. Per installarlo manualmente, trasferire il file sul dispositivo e consentire l'installazione da quella sorgente.

Il pacchetto `*-Android-debug.apk` è firmato con la chiave debug locale e usa l'identificativo `.debug`: è adatto a test e installazione diretta, non a Google Play né come aggiornamento della futura versione release. Per la distribuzione di produzione serve una chiave release persistente custodita dall'editore.

## Limiti rispetto al desktop

Microfono e audio devono essere autorizzati dal browser/app; le prestazioni di rilevamento dell'intonazione dipendono dal dispositivo. Il supporto MIDI varia in base a browser, sistema e periferica; su Android non è garantito. Gli installer Electron per macOS e Windows restano distinti.
