import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

// Apply initial theme based on Orion appearance preferences before React mount
try {
  if (typeof document !== 'undefined') {
    const saved = localStorage.getItem('orion-appearance-preferences');
    let mode = 'dark';
    let themeId = 'graphite';
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.themeId) themeId = parsed.themeId;
        if (parsed.appearanceMode) mode = parsed.appearanceMode;
      } catch {}
    }
    const prefersDark = mode === 'dark' || 
      (mode === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches) ||
      (mode !== 'light' && themeId !== 'silver');

    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(prefersDark ? 'dark' : 'light');
    document.documentElement.style.colorScheme = prefersDark ? 'dark' : 'light';
    if (document.body) {
      document.body.style.backgroundColor = prefersDark ? 'var(--orion-bg, #0B0D0F)' : 'var(--orion-bg, #F5F5F3)';
      document.body.style.color = prefersDark ? 'var(--orion-text-primary, #F2F2EF)' : 'var(--orion-text-primary, #17191B)';
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


