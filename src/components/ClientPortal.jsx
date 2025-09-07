import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs } from "firebase/firestore";
import { piyamTravelLogoBase64 } from '../data';

// --- (All SVG and other components remain the same) ---
const UserIcon = ({ className }) => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg> );
const FingerprintIcon = ({ className }) => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 10a2 2 0 0 0-2 2c0 1.02.5 2.51 2 4 .5-1.5.5-2.5 2-4a2 2 0 0 0-2-2Z"/><path d="M12 2a10 10 0 0 0-10 10c0 4.4 3.6 10 10 10s10-5.6 10-10A10 10 0 0 0 12 2Z"/></svg> );
const FileIcon = ({ className }) => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg> );
const DownloadIcon = ({ className }) => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> );
const InfoIcon = ({ className }) => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg> );
const PreviewIcon = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>);
const XIcon = ({ className }) => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg> );
const PiyamTravelLogo = () => ( <img src={piyamTravelLogoBase64} alt="Piyam Travel Logo"/> );

const fileCategories = [ { name: 'Flights', icon: '✈️' }, { name: 'Hotels', icon: '🏨' }, { name: 'Transport', icon: '🚗' }, { name: 'Visa', icon: '📄' }, { name: 'E-Sim', icon: '📱' }, { name: 'Insurance', icon: '🛡️' }, { name: 'Others', icon: '📎' }, ];

const ClientLoginPage = ({ onLogin, setIsLoading }) => {
    // ... (This component remains the same)
    const [refNumber, setRefNumber] = useState('');
    const [lastName, setLastName] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await fetch('/api/lookup-customer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ referenceNumber: refNumber, lastName }),
            });
            const data = await response.json();
            if (!response.ok) { throw new Error(data.error || 'Customer not found.'); }
            onLogin(data);
        } catch (err) {
            console.error("Login error:", err);
            setError(err.message || 'An error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex justify-center mb-6"><PiyamTravelLogo /></div>
            <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">Client Document Portal</h1>
            <p className="text-gray-500 text-center mb-8">Access your travel documents securely.</p>
            <form className="space-y-6" onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="refNumber" className="block text-sm font-medium text-gray-700">Reference Number</label>
                    <div className="mt-1 flex items-center">
                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">PT-</span>
                        <input type="text" id="refNumber" value={refNumber} onChange={(e) => setRefNumber(e.target.value.toUpperCase())} placeholder="6P7GC2" className="flex-1 block w-full rounded-none rounded-r-lg p-2 border border-gray-300 focus:border-red-500 focus:ring-red-500 sm:text-sm" required />
                    </div>
                </div>
                <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">Last Name</label>
                    <div className="mt-1 relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><UserIcon className="h-5 w-5 text-gray-400" /></div>
                        <input type="text" id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Your last name" className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-red-800 focus:border-red-800" required />
                    </div>
                </div>
                {error && <p className="text-sm text-red-600 text-center">{error}</p>}
                <div>
                     <button type="submit" className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-red-800 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors">Access Documents</button>
                </div>
            </form>
        </div>
    );
};

const ClientDashboard = ({ customer, onLogout }) => {
    const [previewFile, setPreviewFile] = useState(null);
    
    const visibleCategories = fileCategories.filter(category => 
        customer.documents && customer.documents.some(doc => doc.category === category.name)
    );

    const getExpiryDate = () => {
        const dateToUse = customer.accessExpiresAt || customer.createdAt;
        if (!dateToUse?.seconds) return 'N/A';

        const expiryBaseDate = new Date(dateToUse.seconds * 1000);
        
        if (customer.accessExpiresAt) {
             return expiryBaseDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
        } else {
            expiryBaseDate.setMonth(expiryBaseDate.getMonth() + 10);
            return expiryBaseDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
        }
    };
    
    const getLastUpdatedDate = () => {
        if(!customer.lastUpdatedAt?.seconds) return 'Not available';
        return new Date(customer.lastUpdatedAt.seconds * 1000).toLocaleString('en-GB');
    }

    return (
        <>
            <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 w-full">
                <div className="flex flex-col md:flex-row justify-between items-start mb-6 gap-4 border-b pb-4">
                    <div>
                        <div className="flex items-center gap-4">
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Welcome, {customer.firstName} {customer.lastName}</h1>
                            {customer.status === 'Completed' && <span className="text-sm font-bold text-green-800 bg-green-200 px-3 py-1 rounded-full">Package Completed</span>}
                        </div>
                        <p className="text-gray-500 mt-1 font-mono text-sm">Reference: {customer.referenceNumber}</p>
                        <p className="text-gray-500 mt-1 text-xs">Last Updated: {getLastUpdatedDate()}</p>
                    </div>
                    <button onClick={onLogout} className="w-full md:w-auto bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors">Log Out</button>
                </div>
                
                <h2 className="text-xl font-semibold text-gray-700 mb-4">Your Documents</h2>

                {visibleCategories.length > 0 ? (
                    <div className="space-y-6">
                        {visibleCategories.map(category => (
                            <div key={category.name}>
                                <h3 className="font-bold text-lg mb-3">{category.icon} {category.name}</h3>
                                <div className="space-y-2">
                                    {customer.documents.filter(doc => doc.category === category.name).map(file => (
                                        <div key={file.id} className="bg-gray-50 p-3 rounded-lg border flex justify-between items-center">
                                            <div className="flex items-center truncate">
                                                <FileIcon className="h-5 w-5 mr-3 flex-shrink-0 text-gray-500" /><span className="truncate font-medium text-gray-800">{file.name}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => setPreviewFile(file)} className="flex items-center bg-gray-200 text-gray-800 font-semibold py-1 px-3 rounded-lg hover:bg-gray-300 transition-colors text-sm">
                                                    <PreviewIcon className="h-4 w-4 mr-2"/>Preview
                                                </button>
                                                <a href={file.url} download className="flex items-center bg-red-800 text-white font-semibold py-1 px-3 rounded-lg hover:bg-red-700 transition-colors text-sm">
                                                    <DownloadIcon className="h-4 w-4 mr-2" />Download
                                                </a>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                     <div className="text-center py-12"><p className="text-gray-500">No documents have been uploaded for you yet.</p><p className="text-gray-500 mt-2">Please check back later or contact your travel agent.</p></div>
                )}

                <div className="mt-8 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-center text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
                        <InfoIcon className="h-5 w-5 mr-3 flex-shrink-0" />
                        For your security, access to this portal will expire on {getExpiryDate()}. Please download any documents you wish to keep.
                    </div>
                </div>
            </div>

            {/* --- Document Preview Modal --- */}
            {previewFile && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-2xl w-full h-full max-w-4xl max-h-[90vh] flex flex-col">
                        <div className="flex justify-between items-center p-4 border-b flex-shrink-0">
                             <h3 className="font-bold text-lg truncate">{previewFile.name}</h3>
                             <button onClick={() => setPreviewFile(null)} className="text-gray-400 hover:text-gray-800"><XIcon className="h-6 w-6"/></button>
                        </div>
                        <div className="flex-grow p-2">
                            {previewFile.url.endsWith('.jpg') ? (
                                <img src={previewFile.url} alt="Document Preview" className="w-full h-full object-contain" />
                            ) : (
                                <iframe src={previewFile.url} title="Document Preview" className="w-full h-full border-0"></iframe>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default function ClientPortal() {
    const [loggedInCustomer, setLoggedInCustomer] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = (customer) => { setLoggedInCustomer(customer); };
    const handleLogout = () => { setLoggedInCustomer(null); };

    return (
        <div className="bg-gray-100 min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-4xl">
                {isLoading ? (
                    <div className="text-center"><p className="text-gray-500">Loading...</p></div>
                ) : loggedInCustomer ? (
                    <ClientDashboard customer={loggedInCustomer} onLogout={handleLogout} />
                ) : (
                    <ClientLoginPage onLogin={handleLogin} setIsLoading={setIsLoading} />
                )}
            </div>
        </div>
    );
}
