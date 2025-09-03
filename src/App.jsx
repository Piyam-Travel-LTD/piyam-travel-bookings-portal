import React, { useState } from 'react';
import AgentDashboard from './components/AgentDashboard';
import AgentLogin from './components/AgentLogin';
import ClientPortal from './components/ClientPortal';

// This component will act as a router to show the correct page.
// In a real app, this logic would be more complex.
export default function App() {
    // For now, we can toggle between views using a simple state
    // We will replace this with real routing later.
    const [currentView, setCurrentView] = useState('agent-login'); // 'agent-login', 'agent-dashboard', 'client-portal'

    const renderView = () => {
        switch (currentView) {
            case 'agent-dashboard':
                return <AgentDashboard />;
            case 'client-portal':
                return <ClientPortal />;
            case 'agent-login':
            default:
                return <AgentLogin />;
        }
    };

    // A simple way to navigate for this prototype
    // In a real app, you would use a library like React Router.
    const Navigation = () => (
        <nav className="bg-gray-800 text-white p-2 text-center text-xs">
            <p>Prototype Navigation (for testing only):</p>
            <button className="underline p-1 mx-2" onClick={() => setCurrentView('agent-login')}>Agent Login</button>
            <button className="underline p-1 mx-2" onClick={() => setCurrentView('agent-dashboard')}>Agent Dashboard</button>
            <button className="underline p-1 mx-2" onClick={() => setCurrentView('client-portal')}>Client Portal</button>
        </nav>
    );


    return (
        <>
            <Navigation />
            {renderView()}
        </>
    );
}
