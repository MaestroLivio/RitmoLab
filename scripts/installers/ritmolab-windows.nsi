; scripts/installers/ritmolab-windows.nsi
; Installer Windows per RitmoLab.
; Non richiede Electron: installa l'app e crea i collegamenti che la aprono in
; modalità finestra dedicata con Microsoft Edge (preinstallato su Windows 10/11)
; oppure, in alternativa, con Google Chrome / Brave / Vivaldi.
; Fallback: browser predefinito.

Unicode true
ManifestDPIAware true

!include "MUI2.nsh"
!include "FileFunc.nsh"
!include "LogicLib.nsh"
!include "StrFunc.nsh"
${StrRep}

!define APP_NAME      "RitmoLab"
!define APP_ID        "RitmoLab"
!define APP_PUBLISHER "RitmoLab"
!define REGKEY        "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_ID}"

; APP_VERSION e OUTFILE possono essere passati da riga di comando con -D
!ifndef APP_VERSION
  !define APP_VERSION "1.1.0"
!endif
!ifndef OUTFILE
  !define OUTFILE "RitmoLab-${APP_VERSION}-Windows-Setup.exe"
!endif

Name "${APP_NAME} ${APP_VERSION}"
OutFile "${OUTFILE}"
InstallDir "$LOCALAPPDATA\${APP_NAME}"
InstallDirRegKey HKCU "Software\${APP_ID}" "InstallDir"
RequestExecutionLevel user
SetCompressor /SOLID lzma
ShowInstDetails show
ShowUninstDetails show

VIProductVersion "1.1.0.0"
VIAddVersionKey "ProductName"     "${APP_NAME}"
VIAddVersionKey "ProductVersion"  "${APP_VERSION}"
VIAddVersionKey "CompanyName"     "${APP_PUBLISHER}"
VIAddVersionKey "FileDescription" "RitmoLab - Laboratorio Musicale per la Scuola Primaria"
VIAddVersionKey "FileVersion"     "${APP_VERSION}.0"
VIAddVersionKey "LegalCopyright"  "RitmoLab"

!define MUI_ICON   "icon.ico"
!define MUI_UNICON "icon.ico"
!define MUI_ABORTWARNING
!define MUI_WELCOMEPAGE_TITLE "Installa ${APP_NAME} ${APP_VERSION}"
!define MUI_WELCOMEPAGE_TEXT "RitmoLab è un laboratorio musicale per la scuola primaria:$\r$\nritmo, solfeggio, canto, gesti Kodaly e una DAW per creare partiture.$\r$\n$\r$\nL'app funziona completamente offline e non richiede installazioni aggiuntive.$\r$\n$\r$\nPremi Avanti per continuare."

!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!define MUI_FINISHPAGE_RUN "$INSTDIR\${APP_NAME}.cmd"
!define MUI_FINISHPAGE_RUN_TEXT "Avvia ${APP_NAME} ora"
!define MUI_FINISHPAGE_SHOWREADME "$INSTDIR\LEGGIMI.txt"
!define MUI_FINISHPAGE_SHOWREADME_TEXT "Mostra le istruzioni"
!define MUI_FINISHPAGE_SHOWREADME_NOTCHECKED
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

!insertmacro MUI_LANGUAGE "Italian"

/* ------------------------------------------------------------- funzioni ---- */

; Cerca un browser Chromium e mette il percorso in $0.
; Per Edge preferisce msedge_proxy.exe, che avvia la finestra app senza
; mostrare la barra degli indirizzi e senza console.
Function FindBrowser
  StrCpy $0 ""

  ReadRegStr $1 HKLM "SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\msedge.exe" ""
  ${If} $1 == ""
    ReadRegStr $1 HKLM "SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\App Paths\msedge.exe" ""
  ${EndIf}
  ${If} $1 != ""
    ${StrRep} $2 "$1" "msedge.exe" "msedge_proxy.exe"
    ${If} ${FileExists} "$2"
      StrCpy $0 "$2"
    ${Else}
      StrCpy $0 "$1"
    ${EndIf}
    Return
  ${EndIf}

  ${If} ${FileExists} "$LOCALAPPDATA\Microsoft\Edge\Application\msedge_proxy.exe"
    StrCpy $0 "$LOCALAPPDATA\Microsoft\Edge\Application\msedge_proxy.exe"
    Return
  ${EndIf}
  ${If} ${FileExists} "$PROGRAMFILES64\Microsoft\Edge\Application\msedge_proxy.exe"
    StrCpy $0 "$PROGRAMFILES64\Microsoft\Edge\Application\msedge_proxy.exe"
    Return
  ${EndIf}
  ${If} ${FileExists} "$PROGRAMFILES32\Microsoft\Edge\Application\msedge_proxy.exe"
    StrCpy $0 "$PROGRAMFILES32\Microsoft\Edge\Application\msedge_proxy.exe"
    Return
  ${EndIf}

  ReadRegStr $1 HKLM "SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\chrome.exe" ""
  ${If} $1 == ""
    ReadRegStr $1 HKLM "SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\App Paths\chrome.exe" ""
  ${EndIf}
  ${If} $1 != ""
    StrCpy $0 "$1"
    Return
  ${EndIf}
  ${If} ${FileExists} "$PROGRAMFILES64\Google\Chrome\Application\chrome.exe"
    StrCpy $0 "$PROGRAMFILES64\Google\Chrome\Application\chrome.exe"
    Return
  ${EndIf}
  ${If} ${FileExists} "$PROGRAMFILES32\Google\Chrome\Application\chrome.exe"
    StrCpy $0 "$PROGRAMFILES32\Google\Chrome\Application\chrome.exe"
    Return
  ${EndIf}
  ${If} ${FileExists} "$LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
    StrCpy $0 "$LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
    Return
  ${EndIf}

  ${If} ${FileExists} "$PROGRAMFILES64\BraveSoftware\Brave-Browser\Application\brave.exe"
    StrCpy $0 "$PROGRAMFILES64\BraveSoftware\Brave-Browser\Application\brave.exe"
    Return
  ${EndIf}
  ${If} ${FileExists} "$PROGRAMFILES\Vivaldi\Application\vivaldi.exe"
    StrCpy $0 "$PROGRAMFILES\Vivaldi\Application\vivaldi.exe"
    Return
  ${EndIf}
FunctionEnd

; Converte un percorso Windows in URL file:/// con gli spazi codificati.
; $2 = percorso  ->  $3 = URL
Function BuildFileUrl
  ${StrRep} $3 "$2" "\" "/"
  ${StrRep} $3 "$3" " " "%20"
  StrCpy $3 "file:///$3"
FunctionEnd

/* ---------------------------------------------------------------- setup ---- */

Section "RitmoLab" SecMain
  SectionIn RO
  SetOutPath "$INSTDIR"
  SetOverwrite on

  File "RitmoLab.html"
  File "LEGGIMI.txt"
  File "icon.ico"

  Call FindBrowser
  StrCpy $2 "$INSTDIR\RitmoLab.html"
  Call BuildFileUrl

  ; --- Launcher .cmd (usato dal pulsante "Avvia ora" e come via di riserva) ---
  ; Exec di NSIS non gestisce i .lnk, ma gestisce i .cmd: questo file rende
  ; affidabile l'avvio al termine dell'installazione.
  FileOpen $4 "$INSTDIR\${APP_NAME}.cmd" w
  FileWrite $4 "@echo off$\r$\n"
  FileWrite $4 "start $\"$\" "
  ${If} $0 != ""
    FileWrite $4 "$\"$0$\" --app=$\"$3$\" --user-data-dir=$\"$INSTDIR\profile$\" --no-first-run --no-default-browser-check --start-maximized --autoplay-policy=no-user-gesture-required$\r$\n"
  ${Else}
    FileWrite $4 "$\"$INSTDIR\RitmoLab.html$\"$\r$\n"
  ${EndIf}
  FileClose $4

  ; --- Collegamento principale ------------------------------------------
  ${If} $0 != ""
    CreateShortCut "$INSTDIR\${APP_NAME}.lnk" "$0" \
      '--app="$3" --user-data-dir="$INSTDIR\profile" --no-first-run --no-default-browser-check --start-maximized --autoplay-policy=no-user-gesture-required' \
      "$INSTDIR\icon.ico" 0 SW_SHOWNORMAL "" "RitmoLab - Laboratorio Musicale"
  ${Else}
    CreateShortCut "$INSTDIR\${APP_NAME}.lnk" "$INSTDIR\RitmoLab.html" "" \
      "$INSTDIR\icon.ico" 0 SW_SHOWNORMAL "" "RitmoLab - Laboratorio Musicale"
  ${EndIf}

  ; Collegamenti in Start Menu e sul Desktop
  CreateDirectory "$SMPROGRAMS\RitmoLab"
  CreateShortCut "$SMPROGRAMS\RitmoLab\${APP_NAME}.lnk" "$INSTDIR\${APP_NAME}.lnk"
  CreateShortCut "$SMPROGRAMS\RitmoLab\Leggimi.lnk" "$INSTDIR\LEGGIMI.txt"
  CreateShortCut "$SMPROGRAMS\RitmoLab\Disinstalla ${APP_NAME}.lnk" "$INSTDIR\Uninstall.exe"

  ${IfNot} ${FileExists} "$DESKTOP\${APP_NAME}.lnk"
    CreateShortCut "$DESKTOP\${APP_NAME}.lnk" "$INSTDIR\${APP_NAME}.lnk"
  ${EndIf}

  ; --- Disinstallatore e registro --------------------------------------
  WriteUninstaller "$INSTDIR\Uninstall.exe"

  WriteRegStr HKCU "Software\${APP_ID}" "InstallDir" "$INSTDIR"
  WriteRegStr HKCU "Software\${APP_ID}" "Browser"    "$0"
  WriteRegStr HKCU "${REGKEY}" "DisplayName"     "${APP_NAME} ${APP_VERSION}"
  WriteRegStr HKCU "${REGKEY}" "DisplayIcon"     "$INSTDIR\icon.ico"
  WriteRegStr HKCU "${REGKEY}" "DisplayVersion"  "${APP_VERSION}"
  WriteRegStr HKCU "${REGKEY}" "Publisher"       "${APP_PUBLISHER}"
  WriteRegStr HKCU "${REGKEY}" "InstallLocation" "$INSTDIR"
  WriteRegStr HKCU "${REGKEY}" "UninstallString" '"$INSTDIR\Uninstall.exe"'
  WriteRegDWORD HKCU "${REGKEY}" "NoModify" 1
  WriteRegDWORD HKCU "${REGKEY}" "NoRepair" 1

  ${GetSize} "$INSTDIR" "/S=0K" $1 $4 $5
  IntFmt $1 "0x%08X" $1
  WriteRegDWORD HKCU "${REGKEY}" "EstimatedSize" "$1"
SectionEnd

Section "Uninstall"
  Delete "$DESKTOP\${APP_NAME}.lnk"
  Delete "$SMPROGRAMS\RitmoLab\${APP_NAME}.lnk"
  Delete "$SMPROGRAMS\RitmoLab\Leggimi.lnk"
  Delete "$SMPROGRAMS\RitmoLab\Disinstalla ${APP_NAME}.lnk"
  RMDir  "$SMPROGRAMS\RitmoLab"

  Delete "$INSTDIR\${APP_NAME}.lnk"
  Delete "$INSTDIR\${APP_NAME}.cmd"
  Delete "$INSTDIR\RitmoLab.html"
  Delete "$INSTDIR\LEGGIMI.txt"
  Delete "$INSTDIR\icon.ico"
  Delete "$INSTDIR\Uninstall.exe"
  RMDir /r "$INSTDIR\profile"
  RMDir "$INSTDIR"

  DeleteRegKey HKCU "${REGKEY}"
  DeleteRegKey HKCU "Software\${APP_ID}"
SectionEnd
