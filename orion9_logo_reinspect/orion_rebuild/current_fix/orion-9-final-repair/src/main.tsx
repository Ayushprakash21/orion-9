import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

// Ensure dark theme is applied immediately to prevent any white screen flashes
try {
  if (typeof document !== 'undefined') {
    document.documentElement.classList.add('dark');
    document.documentElement.style.colorScheme = 'dark';
    if (document.body) {
      document.body.style.backgroundColor = '#07090E';
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
    console.warn('[ORION SCM OS] Suppressed unhandled promise rejection:', event.reason);
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


