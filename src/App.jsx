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
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <p className="text-gray-500">Loading Portal...</p>
      </div>
    );
  }

  return (
    <Routes>
      {/* Route for the Client Portal - This is the default route */}
      <Route path="/" element={<ClientPortal />} />
      
      {/* Route for the Agent Side */}
      <Route 
        path="/agent" 
        element={
          user ? <AgentDashboard onLogout={handleLogout} /> : <AgentLogin />
        } 
      />
      
      {/* Redirect any other unknown path back to the client portal */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
