import React, { useState } from 'react';
import { db } from '../firebase'; // Import from central file
import { collection, query, where, getDocs } from "firebase/firestore";

// --- Components (SVGs remain the same) ---
const PiyamTravelLogo = () => ( <img src="data:image/png;base64,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" alt="Piyam Travel Logo"/> );
const UserIcon = ({ className }) => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg> );
const FingerprintIcon = ({ className }) => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 10a2 2 0 0 0-2 2c0 1.02.5 2.51 2 4 .5-1.5.5-2.5 2-4a2 2 0 0 0-2-2Z"/><path d="M12 2a10 10 0 0 0-10 10c0 4.4 3.6 10 10 10s10-5.6 10-10A10 10 0 0 0 12 2Z"/></svg> );
const FileIcon = ({ className }) => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg> );
const DownloadIcon = ({ className }) => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> );
const InfoIcon = ({ className }) => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg> );

const ClientLoginPage = ({ onLogin, setIsLoading }) => {
    const [refNumber, setRefNumber] = useState('');
    const [lastName, setLastName] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const customersRef = collection(db, "customers");
            const q = query(customersRef, 
                where("referenceNumber", "==", refNumber.trim().toUpperCase()), 
                where("lastName", "==", lastName.trim())
            );

            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                setError('Invalid reference number or last name. Please try again.');
            } else {
                const customerData = querySnapshot.docs[0].data();
                onLogin({ id: querySnapshot.docs[0].id, ...customerData });
            }
        } catch (err) {
            console.error("Error logging in: ", err);
            setError("An error occurred. Please try again later.");
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
                    <div className="mt-1 relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><FingerprintIcon className="h-5 w-5 text-gray-400" /></div>
                        <input type="text" id="refNumber" value={refNumber} onChange={(e) => setRefNumber(e.target.value.toUpperCase())} placeholder="e.g., PT-A8B3C1" className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-red-800 focus:border-red-800" required />
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
    const visibleCategories = fileCategories.filter(category => 
        customer.documents && customer.documents.some(doc => doc.category === category.name)
    );

    const getExpiryDate = () => {
        if (!customer.createdAt) return 'N/A';
        const creationDate = new Date(customer.createdAt);
        creationDate.setMonth(creationDate.getMonth() + 10);
        return creationDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    };

    return (
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 w-full">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 border-b pb-4">
                <div><h1 className="text-2xl md:text-3xl font-bold text-gray-800">Welcome, {customer.firstName} {customer.lastName}</h1><p className="text-gray-500 mt-1 font-mono text-sm">Reference: {customer.referenceNumber}</p></div>
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
                                        <div className="flex items-center truncate"><FileIcon className="h-5 w-5 mr-3 flex-shrink-0 text-gray-500" /><span className="truncate font-medium text-gray-800">{file.name}</span></div>
                                        <a href="#" download={file.name} className="flex items-center bg-red-800 text-white font-semibold py-1 px-3 rounded-lg hover:bg-red-700 transition-colors text-sm ml-4"><DownloadIcon className="h-4 w-4 mr-2" />Download</a>
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
