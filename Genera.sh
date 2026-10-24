#!/bin/bash

echo "🚀 Inizio configurazione e compilazione Electron..."

# 1. Inizializza il progetto Node.js se non esiste già package.json
if [ ! -f "package.json" ]; then
    echo "📦 Inizializzazione package.json..."
    npm init -y
fi

# 2. Crea main.js per Electron
echo "📝 Creazione di main.js..."
cat << 'EOF' > main.js
const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  win.loadFile('index.html');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
EOF

# 3. Imposta main e script start in package.json
echo "⚙️ Configurazione package.json..."
npx npm-add-script -k main -v "main.js" --force
npx npm-add-script -k start -v "electron ." --force

# 4. Installa Electron
echo "📥 Installazione di Electron..."
npm install --save-dev electron

# 5. Inizializza Electron Forge
echo "🔨 Configurazione di Electron Forge..."
npx @electron-forge/cli import --yes

# 6. Genera l'eseguibile
echo "📦 Generazione dell'eseguibile in corso..."
npm run make

echo "✅ Completato! Trovi l'eseguibile pronto nella cartella 'out/make'."