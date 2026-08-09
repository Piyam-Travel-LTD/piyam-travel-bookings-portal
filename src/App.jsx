import React, { lazy, Suspense, useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

const ClientPortal = lazy(() => import('./components/ClientPortal'));
const AgentPortal = lazy(() => import('./components/AgentPortal'));

function getInitialTheme() {
  try {
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme === 'light' || storedTheme === 'dark') return storedTheme;
  } catch (_error) {
    // Fall through to the visitor's operating-system preference.
  }

  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

function RouteLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
      <p className="text-gray-500">Loading portal…</p>
    </div>
  );
}

export default function App() {
  const [theme, setTheme] = useState(getInitialTheme);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    try {
      localStorage.setItem('theme', newTheme);
    } catch (_error) {
      // Theme persistence is optional when browser storage is unavailable.
    }
  };

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  return (
    <div className="relative min-h-screen">
      <button
        type="button"
        onClick={toggleTheme}
        className="fixed bottom-4 right-4 z-50 inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-300 bg-white/95 px-3 py-2 text-sm font-semibold text-slate-800 shadow-lg backdrop-blur transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:border-slate-600 dark:bg-slate-800/95 dark:text-slate-100 dark:hover:bg-slate-700 dark:focus:ring-offset-slate-950"
        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        aria-pressed={theme === 'dark'}
      >
        <span aria-hidden="true">{theme === 'light' ? '🌙' : '☀️'}</span>
        <span className="hidden sm:inline">{theme === 'light' ? 'Dark mode' : 'Light mode'}</span>
      </button>
      <Suspense fallback={<RouteLoading />}>
        <Routes>
          <Route path="/" element={<ClientPortal />} />
          <Route path="/documents" element={<ClientPortal />} />
          <Route path="/package-documents/:token" element={<ClientPortal />} />
          <Route path="/agent" element={<AgentPortal />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </div>
  );
}
