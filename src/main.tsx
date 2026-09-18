import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

// Apply initial theme based on system preference or saved setting
try {
  if (typeof document !== 'undefined') {
    const savedSettings = localStorage.getItem('orion_system_settings');
    let theme: string = 'system';
    try {
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        if (parsed.theme) theme = parsed.theme;
      }
    } catch {}
    
    const prefersDark = theme === 'dark' || 
      (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(prefersDark ? 'dark' : 'light');
    document.documentElement.style.colorScheme = prefersDark ? 'dark' : 'light';
    if (document.body) {
      document.body.style.backgroundColor = prefersDark ? '#07090E' : '#F5F5F7';
    }
  }
} catch (e) {
  console.warn('Initial theme setup warning:', e);
}

// Global safety catchers for unhandled exceptions
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    // Prevent default browser error reporting and uncaught exception escalation
    event.preventDefault();
    console.warn('[ORION-9] Suppressed unhandled promise rejection:', event.reason);
  });
}

const rootEl = document.getElementById('root');
if (rootEl) {
  createRoot(rootEl).render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>,
  );
}


