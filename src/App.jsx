import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from './firebase'; // Import auth from the central file
import AgentLogin from './components/AgentLogin';
import AgentDashboard from './components/AgentDashboard';
import ClientPortal from './components/ClientPortal';

export default function App() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // This is a simple router. We'll check the URL path to decide which portal to show.
  const isClientPortal = window.location.pathname === '/client';

  useEffect(() => {
    // This listener checks the agent's sign-in state
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
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <p className="text-gray-500">Loading Portal...</p>
      </div>
    );
  }

  // --- View Rendering Logic ---
  // If the URL is for the client portal, show that.
  // Otherwise, check if an agent is logged in and show either the dashboard or agent login.
  if (isClientPortal) {
    return <ClientPortal />;
  } else {
    return user ? <AgentDashboard onLogout={handleLogout} /> : <AgentLogin />;
  }
}
