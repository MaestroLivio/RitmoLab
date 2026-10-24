import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

function mountApp() {
  const container = document.getElementById('root');
  if (!container) {
    console.error('RitmoLab: Root container #root not found.');
    return;
  }
  try {
    const root = ReactDOM.createRoot(container);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (err) {
    console.error('RitmoLab: Error mounting React application:', err);
    container.innerHTML = `
      <div style="display:flex;min-height:100vh;align-items:center;justify-content:center;background:#FFFBEB;font-family:sans-serif;padding:20px;">
        <div style="background:white;padding:32px;border-radius:24px;border:2px solid #FCD34D;box-shadow:0 10px 25px rgba(0,0,0,0.1);max-width:500px;text-align:center;">
          <div style="font-size:48px;margin-bottom:12px;">⚠️</div>
          <h2 style="color:#92400E;margin-bottom:8px;font-size:20px;font-weight:bold;">Impossibile avviare RitmoLab</h2>
          <p style="color:#B45309;font-size:13px;margin-bottom:16px;">${err?.message || err}</p>
          <button onclick="location.reload()" style="padding:10px 24px;background:#10B981;color:white;font-weight:bold;border:none;border-radius:12px;cursor:pointer;">
            Ricarica Pagina
          </button>
        </div>
      </div>
    `;
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountApp);
} else {
  mountApp();
}
