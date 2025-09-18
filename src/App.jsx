import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from './firebase'; 
import AgentLogin from './components/AgentLogin';
import AgentDashboard from './components/AgentDashboard';
import ClientPortal from './components/ClientPortal';

export default function App() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = () => {
    signOut(auth).catch((error) => console.error("Sign out error:", error));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900">
        <p className="text-gray-500">Loading Portal...</p>
      </div>
    );
  }

  return (
    <div className="relative">
        <button
            onClick={toggleTheme}
            className="fixed bottom-4 right-4 bg-gray-200 dark:bg-gray-700 p-2 rounded-full z-50 shadow-lg"
            aria-label="Toggle theme"
        >
            {theme === 'light' ? '🌙' : '☀️'}
        </button>
        <Routes>
            <Route path="/" element={<ClientPortal />} />
            <Route path="/agent" element={user ? <AgentDashboard onLogout={handleLogout} /> : <AgentLogin />} />
            <Route path="*" element={<Navigate to="/" />} />
        </Routes>
    </div>
  );
}
