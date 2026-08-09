import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../firebase';
import AgentDashboard from './AgentDashboard';
import AgentLogin from './AgentLogin';

export default function AgentPortal() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (nextUser) => {
        setUser(nextUser);
        setIsLoading(false);
      },
      (error) => {
        console.error('Agent authentication state error:', error);
        setIsLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
        <p className="text-gray-500">Loading agent portal…</p>
      </div>
    );
  }

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Agent sign out error:', error);
    }
  };

  return user ? <AgentDashboard onLogout={handleLogout} /> : <AgentLogin />;
}
