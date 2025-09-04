import React, { useState } from 'react';
import { getAuth, OAuthProvider, signInWithPopup } from "firebase/auth";

const PiyamTravelLogo = () => ( <img src="data:image/png;base64,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" alt="Piyam Travel Logo"/> );
const MicrosoftIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="mr-3">
        <path d="M11.208 2.021H2.25V10.97h8.958V2.02zm0 9.86H2.25v8.958h8.958v-8.96zm.911-9.86H21.08v8.958h-8.96V2.02zm0 9.86H21.08v8.958h-8.96v-8.96z"></path>
    </svg>
);

export default function AgentLogin() {
    const [error, setError] = useState('');

    const handleMicrosoftLogin = () => {
        const auth = getAuth();
        const provider = new OAuthProvider('microsoft.com');
        // Optional: You can add custom scopes if needed
        // provider.addScope('mail.read');

        signInWithPopup(auth, provider)
            .then((result) => {
                // User is signed in.
                // You don't need to do anything here, the onAuthStateChanged listener in App.jsx will handle it.
            })
            .catch((error) => {
                // Handle Errors here.
                console.error("Microsoft Sign-In Error: ", error);
                setError(`Login failed: ${error.message}`);
            });
    };

    return (
        <div className="bg-gray-100 min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-sm">
                <div className="bg-white rounded-2xl shadow-lg p-8">
                    <div className="flex justify-center mb-6">
                        <PiyamTravelLogo />
                    </div>
                    <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">Agent Portal</h1>
                    <p className="text-gray-500 text-center mb-8">Please sign in with your corporate account.</p>
                    
                    <div className="space-y-4">
                        <button 
                            onClick={handleMicrosoftLogin}
                            className="w-full flex items-center justify-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                        >
                            <MicrosoftIcon />
                            Sign in with Microsoft
                        </button>
                    </div>

                    {error && <p className="text-xs text-red-600 text-center mt-4">{error}</p>}
                </div>
            </div>
        </div>
    );
}
