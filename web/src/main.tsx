import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles.css';

const banner = document.getElementById('connection')!;
window.addEventListener('offline', () => {
  banner.innerHTML = '<strong>You are offline.</strong> Changes will not be saved until you reconnect.';
  banner.classList.add('visible');
});
window.addEventListener('online', () => {
  banner.textContent = '';
  banner.classList.remove('visible');
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
