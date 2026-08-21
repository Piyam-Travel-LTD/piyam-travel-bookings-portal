import React, { lazy, Suspense, useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

const ClientPortal = lazy(() => import('./components/ClientPortal'));

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
      <Suspense fallback={<RouteLoading />}>
        <Routes>
          <Route path="/" element={<ClientPortal theme={theme} onToggleTheme={toggleTheme} />} />
          <Route path="/documents" element={<ClientPortal theme={theme} onToggleTheme={toggleTheme} />} />
          <Route path="/package-documents/:token" element={<ClientPortal theme={theme} onToggleTheme={toggleTheme} />} />
          <Route path="/agent" element={<Navigate to="/" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </div>
  );
}
