# Android toolchain per agenti e progetti locali

Toolchain installata a livello utente su macOS:

- JDK 17: `JAVA_HOME` già configurato in `~/.zshrc`.
- Android SDK: `$ANDROID_HOME` / `$ANDROID_SDK_ROOT` puntano a `~/Library/Android/sdk`.
- Android SDK Command-line Tools: `sdkmanager`, `adb`, `avdmanager` e strumenti collegati sono nel `PATH` via Homebrew.
- Piattaforme installate: Android API 35 e 36; build-tools 35.0.0 e 36.1.0.
- Gradle globale disponibile via Homebrew. Per i progetti Android usare preferibilmente il **Gradle Wrapper del progetto** (`./gradlew`), che seleziona la versione compatibile con il relativo Android Gradle Plugin.

In nuovi terminali le variabili SDK sono disponibili nei login shell e negli shell Zsh non-login. Gli agenti che avviano processi non interattivi possono impostare esplicitamente:

```sh
export ANDROID_HOME="$HOME/Library/Android/sdk"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
```

Non sono stati installati Android Studio, NDK o immagini emulator aggiuntive. Si possono aggiungere in seguito secondo le necessità del progetto; gli emulatori e le immagini già presenti non sono stati rimossi.

Per RitmoLab, `npm run android:build` prepara l'app web e produce un APK debug installabile in `installers/Android/`. Per altre app, usare il relativo progetto Android e wrapper Gradle.
