import React, { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import AgentLogin from './components/AgentLogin';
import AgentDashboard from './components/AgentDashboard';
import ClientPortal from './components/ClientPortal';

// Initialize Firebase Auth
const auth = getAuth();

export default function App() {
  const [user, setUser] = useState(null); // Will hold the logged-in user object
  const [isLoading, setIsLoading] = useState(true); // To show a loading state while checking auth

  useEffect(() => {
    // This listener checks the user's sign-in state
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is signed in.
        setUser(user);
      } else {
        // User is signed out.
        setUser(null);
      }
      setIsLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const handleLogout = () => {
    signOut(auth).catch((error) => {
      console.error("Sign out error:", error);
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <p className="text-gray-500">Loading Portal...</p>
      </div>
    );
  }

  return (
    <div>
      {/* If a user is logged in, show the dashboard. Otherwise, show the login page. */}
      {user ? (
        <AgentDashboard onLogout={handleLogout} />
      ) : (
        <AgentLogin />
      )}
    </div>
  );
}
