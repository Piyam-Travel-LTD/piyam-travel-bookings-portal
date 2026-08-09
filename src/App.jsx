import React, { lazy, Suspense, useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

const ClientPortal = lazy(() => import('./components/ClientPortal'));
const AgentPortal = lazy(() => import('./components/AgentPortal'));

function RouteLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
      <p className="text-gray-500">Loading portal…</p>
    </div>
  );
}

export default function App() {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('theme') || 'light';
    } catch (_error) {
      return 'light';
    }
  });

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
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <div className="relative">
        <button
            onClick={toggleTheme}
            className="fixed bottom-4 right-4 bg-gray-200 dark:bg-gray-700 p-2 rounded-full z-50 shadow-lg"
            aria-label="Toggle theme"
        >
            {theme === 'light' ? '🌙' : '☀️'}
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
