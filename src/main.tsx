import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Registrar service worker para cache
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registrado com sucesso:', registration.scope);
      })
      .catch((error) => {
        console.log('Falha ao registrar SW:', error);
      });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
