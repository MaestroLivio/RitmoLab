# Firma delle release Android

`npm run android:build` genera solo APK **release**, firmati con la keystore
privata permanente `ritmolab-release`. La compilazione allinea l'APK e verifica
firma e schemi v1, v2 e v3 prima di copiarlo in `installers/Android/`.
`npm run android:debug` è riservato ai test e non produce l'artefatto di
distribuzione.

La chiave generata è RSA 3072 bit; l'impronta SHA-256 pubblica del certificato
è `DF:16:EC:68:90:BF:71:F1:72:4A:0B:56:BE:C1:14:8B:25:4A:2D:5A:C2:B8:49:84:97:FC:86:DE:DA:D8:3F:0A`.

## Credenziali

La keystore non fa parte del repository. Su macOS la configurazione locale usa:

- `~/Library/Application Support/RitmoLab/android-release.jks`
- Portachiavi macOS: `RitmoLab Android Release Keystore` e
  `RitmoLab Android Release Key`, account uguale al nome utente macOS
- alias predefinito `ritmolab-release`

Su altre macchine impostare `ANDROID_RELEASE_KEYSTORE`,
`ANDROID_RELEASE_KEYSTORE_PASSWORD`, `ANDROID_RELEASE_KEY_ALIAS` e
`ANDROID_RELEASE_KEY_PASSWORD` nell'ambiente del processo Gradle. Non salvarli
in file versionati, log o script condivisi.

La pipeline GitHub Actions richiede questi repository Actions Secrets:

- `ANDROID_RELEASE_KEYSTORE_BASE64`
- `ANDROID_RELEASE_KEYSTORE_PASSWORD`
- `ANDROID_RELEASE_KEY_ALIAS`
- `ANDROID_RELEASE_KEY_PASSWORD`

Il workflow decodifica la keystore nella directory temporanea del runner,
costruisce e verifica l'APK prima di caricarlo come asset. Il job di
pubblicazione ripete i controlli di allineamento e firma; se uno schema o la
keystore mancano, la release fallisce e l'APK non viene pubblicato. Non
distribuire mai APK debug.

## Backup e ripristino

La keystore è l'identità crittografica dell'app: conservarla per tutte le
versioni future. Perdere la chiave impedisce di firmare aggiornamenti
installabili sopra le versioni esistenti con lo stesso application ID.

1. Copiare `android-release.jks` su almeno due supporti privati distinti,
   preferibilmente offline e cifrati; conservare le password separatamente
   in un password manager.
2. Non inviare la keystore via e-mail/chat e non aggiungerla a Git o agli
   artefatti pubblici.
3. Per il ripristino, copiare la keystore in
   `~/Library/Application Support/RitmoLab/android-release.jks`, limitare i
   permessi (`chmod 600` sul file e `chmod 700` sulla cartella) e ripristinare
   le due voci del Portachiavi con le password originali.
4. Per un runner CI nuovo, convertire la stessa keystore in Base64 e
   aggiornare i quattro Actions Secrets; non generare una nuova chiave per una
   release successiva.
5. Verificare che alias e certificato siano quelli previsti prima di compilare:

   ```sh
   keytool -list -v -keystore "$ANDROID_RELEASE_KEYSTORE" \
     -alias "$ANDROID_RELEASE_KEY_ALIAS"
   ```

Se la chiave è compromessa, non sostituirla silenziosamente: le app già
installate non accetteranno l'aggiornamento firmato da una chiave diversa.
