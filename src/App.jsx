import React, { useState } from 'react';
import AgentLogin from './components/AgentLogin';
import AgentDashboard from './components/AgentDashboard';
import ClientPortal from './components/ClientPortal';

// This is a simple router to switch between views.
export default function App() {
  const [view, setView] = useState('agent-login'); // 'agent-login', 'agent-dashboard', 'client-portal'
  
  // This is a simulation of a successful agent login
  const handleAgentLogin = () => {
    setView('agent-dashboard');
  };

  const renderView = () => {
    switch (view) {
      case 'agent-dashboard':
        return <AgentDashboard />;
      case 'client-portal':
        return <ClientPortal />;
      case 'agent-login':
      default:
        return <AgentLogin onLogin={handleAgentLogin} />;
    }
  };

  return (
    <div>
      {/* This temporary navigation helps switch views during development */}
      <nav className="bg-gray-800 text-white p-2 text-xs text-center no-print">
        <span className="font-bold">DEV-NAV:</span>
        <button onClick={() => setView('agent-login')} className="mx-2 underline">Agent Login</button>
        <button onClick={() => setView('agent-dashboard')} className="mx-2 underline">Agent Dashboard</button>
        <button onClick={() => setView('client-portal')} className="mx-2 underline">Client Portal</button>
      </nav>
      {renderView()}
    </div>
  );
}
