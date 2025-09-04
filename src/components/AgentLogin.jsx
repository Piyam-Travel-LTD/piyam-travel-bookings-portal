import React, { useState } from 'react';
import { getAuth, OAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from '../firebase';
import { piyamTravelLogoBase64 } from '../data'; // Import logo

const PiyamTravelLogo = () => ( <img src={piyamTravelLogoBase64} alt="Piyam Travel Logo"/> );
const MicrosoftIcon = () => ( <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="mr-3"><path d="M11.208 2.021H2.25V10.97h8.958V2.02zm0 9.86H2.25v8.958h8.958v-8.96zm.911-9.86H21.08v8.958h-8.96V2.02zm0 9.86H21.08v8.958h-8.96v-8.96z"></path></svg> );

export default function AgentLogin() {
    const [error, setError] = useState('');

    const handleMicrosoftLogin = () => {
        const provider = new OAuthProvider('microsoft.com');
        provider.setCustomParameters({
            tenant: '1435da88-703e-449d-9c3d-cf30ba83d326',
        });
        
        signInWithPopup(auth, provider)
            .catch((error) => {
                console.error("Microsoft Sign-In Error: ", error);
                setError(`Login failed: ${error.message}`);
            });
    };

    return (
        <div className="bg-gray-100 min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-sm">
                <div className="bg-white rounded-2xl shadow-lg p-8">
                    <div className="flex justify-center mb-6"><PiyamTravelLogo /></div>
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
