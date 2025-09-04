import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from './firebase'; 
import AgentLogin from './components/AgentLogin';
import AgentDashboard from './components/AgentDashboard';
import ClientPortal from './components/ClientPortal';

export default function App() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // This listener checks the user's sign-in state and sets the user object.
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setIsLoading(false);
    });
    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const handleLogout = () => {
    signOut(auth).catch((error) => console.error("Sign out error:", error));
  };

  // Display a loading message while Firebase authentication is being checked.
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <p className="text-gray-500">Loading Portal...</p>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Route for the Client Portal */}
        <Route path="/client" element={<ClientPortal />} />
        
        {/* Route for the Agent Side */}
        <Route 
          path="/" 
          element={
            user ? <AgentDashboard onLogout={handleLogout} /> : <AgentLogin />
          } 
        />
        
        {/* Redirect any other path to the agent login */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}
