import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from './firebase'; // Import auth from the central file
import AgentLogin from './components/AgentLogin';
import AgentDashboard from './components/AgentDashboard';
import ClientPortal from './components/ClientPortal';

export default function App() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState('agent-login'); // Default view

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) {
        setView('agent-dashboard');
      } else {
        setView('agent-login');
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = () => {
    signOut(auth).catch((error) => console.error("Sign out error:", error));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <p className="text-gray-500">Loading Portal...</p>
      </div>
    );
  }

  const renderView = () => {
    switch (view) {
      case 'agent-dashboard':
        return user ? <AgentDashboard onLogout={handleLogout} /> : <AgentLogin />;
      case 'client-portal':
        return <ClientPortal />;
      case 'agent-login':
      default:
        return <AgentLogin />;
    }
  };

  return (
    <div>
      <nav className="bg-gray-800 text-white p-2 text-xs text-center no-print">
        <span className="font-bold">DEV-NAV (for testing):</span>
        <button onClick={() => setView('agent-login')} className="mx-2 underline">Agent Login</button>
        <button onClick={() => setView('client-portal')} className="mx-2 underline">Client Portal</button>
      </nav>
      {renderView()}
    </div>
  );
}
