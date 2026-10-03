import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register Service Worker for offline PWA
registerSW({
  immediate: true,
  onRegistered(r) {
    if (r) {
      console.log('PWA Service Worker registered, scope:', r.scope);
    }
  },
  onRegisterError(error) {
    console.warn('PWA Service Worker registration warning:', error);
  },
});

// Explicit registration fallback using BASE_URL for GitHub Pages support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const swUrl = `${import.meta.env.BASE_URL}sw.js`;
    navigator.serviceWorker
      .register(swUrl, { scope: import.meta.env.BASE_URL })
      .catch(() => {
        // Handled by registerSW
      });
  });
}

createRoot(document.getElementById('root')!).render(<App />);
