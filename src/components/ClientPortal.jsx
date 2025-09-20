import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { piyamTravelLogoBase64, fileCategories } from '../data';
import { UserIcon, PhoneIcon, MailIcon, SimCardIcon, GlobeIcon, FileIcon, DownloadIcon, InfoIcon, PreviewIcon, XIcon } from './Icons'; // Assuming you add these new icons

const PiyamTravelLogo = () => ( <img src={piyamTravelLogoBase64} alt="Piyam Travel Logo"/> );

// --- Updated Login Page with a softer look ---
const ClientLoginPage = ({ onLogin, setIsLoading }) => {
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
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border-t-4 border-red-800">
            <div className="p-8">
                <div className="flex justify-center mb-6"><PiyamTravelLogo /></div>
                <h1 className="text-2xl font-bold text-center text-gray-800 dark:text-gray-200 mb-2">Client Document Portal</h1>
                <p className="text-gray-500 text-center mb-8">Access your travel documents securely.</p>
                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="refNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Reference Number</label>
                        <div className="mt-1 flex items-center">
                            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400">PT-</span>
                            <input type="text" id="refNumber" value={refNumber} onChange={(e) => setRefNumber(e.target.value.toUpperCase())} placeholder="6P7GC2" className="flex-1 block w-full rounded-none rounded-r-lg p-2 border border-gray-300 focus:border-red-500 focus:ring-red-500 sm:text-sm dark:bg-gray-900 dark:border-gray-600" required />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Last Name</label>
                        <div className="mt-1 relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><UserIcon className="h-5 w-5 text-gray-400" /></div>
                            <input type="text" id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Your last name" className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-red-800 focus:border-red-800 dark:bg-gray-900 dark:border-gray-600" required />
                        </div>
                    </div>
                    {error && <p className="text-sm text-red-600 text-center">{error}</p>}
                    <div>
                         <button type="submit" className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-red-800 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors">Access Documents</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- Updated Dashboard with improved visual hierarchy ---
const ClientDashboard = ({ customer, onLogout, onCustomerUpdate }) => {
    const [previewFile, setPreviewFile] = useState(null);
    const [isChecklistVisible, setIsChecklistVisible] = useState(true);
    const [localSim, setLocalSim] = useState(customer.keyInformation?.customerSim || '');
    const [localEmail, setLocalEmail] = useState(customer.keyInformation?.customerEmail || '');

    useEffect(() => {
        setLocalSim(customer.keyInformation?.customerSim || '');
        setLocalEmail(customer.keyInformation?.customerEmail || '');
    }, [customer]);

    const handleSaveContactInfo = async () => {
        const newKeyInfo = {
            ...customer.keyInformation,
            customerSim: localSim,
            customerEmail: localEmail,
            isEmailLocked: true
        };
        const customerDocRef = doc(db, "customers", customer.id);
        try {
            await updateDoc(customerDocRef, { keyInformation: newKeyInfo, lastUpdatedAt: serverTimestamp() });
            onCustomerUpdate({ ...customer, keyInformation: newKeyInfo, lastUpdatedAt: new Date().toISOString() });
            alert("Your contact information has been saved.");
        } catch (error) {
            console.error("Error updating contact info:", error);
            alert("Could not save your information. Please try again.");
        }
    };

    const visibleCategories = fileCategories.filter(category =>
        customer.documents && customer.documents.some(doc => doc.category === category.name)
    );

    const getExpiryDate = () => {
        const dateToUse = customer.accessExpiresAt || customer.createdAt;
        if (!dateToUse) return 'N/A';
        const expiryBaseDate = new Date(dateToUse);
        if (!customer.accessExpiresAt) {
            expiryBaseDate.setMonth(expiryBaseDate.getMonth() + 10);
        }
        return expiryBaseDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    };

    const getLastUpdatedDate = () => {
        if (!customer.lastUpdatedAt) return 'Not available';
        return new Date(customer.lastUpdatedAt).toLocaleString('en-GB');
    }

    const keyInfo = customer.keyInformation || {};
    const checklist = customer.checklist || [];
    const isEmailEditable = !keyInfo.isEmailLocked || !keyInfo.customerEmail;

    const handleChecklistItemToggle = async (itemId) => {
        const updatedChecklist = checklist.map(item =>
            item.id === itemId ? { ...item, completed: !item.completed } : item
        );
        const customerDocRef = doc(db, "customers", customer.id);
        try {
            await updateDoc(customerDocRef, { checklist: updatedChecklist });
            onCustomerUpdate({ ...customer, checklist: updatedChecklist });
        } catch (error) {
            console.error("Error updating checklist:", error);
        }
    };

    return (
        <>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-8 w-full">
                {/* --- Header Section --- */}
                <div className="flex flex-col md:flex-row justify-between items-start mb-8 gap-4 border-b border-gray-200 dark:border-gray-700 pb-6">
                    <div>
                        <p className="text-gray-500 font-mono text-sm">Reference: {customer.referenceNumber}</p>
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white mt-1">Welcome, {customer.firstName} {customer.lastName}</h1>
                        <p className="text-gray-600 dark:text-gray-300 mt-2 text-lg font-semibold">{customer.packageType} to {customer.destination}</p>
                    </div>
                    <div className="flex flex-col items-start md:items-end gap-3 w-full md:w-auto">
                        {customer.status === 'Completed' && <span className="text-base font-bold text-green-800 bg-green-200 px-4 py-2 rounded-full dark:bg-green-900 dark:text-green-300">Package Completed</span>}
                        <button onClick={onLogout} className="w-full md:w-auto bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">Log Out</button>
                    </div>
                </div>

                {/* --- Key Information with Icons --- */}
                <div className="mb-8 p-4 bg-slate-50 border border-slate-200 rounded-lg dark:bg-slate-700 dark:border-slate-600">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 dark:text-slate-200">Key Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm text-slate-700 dark:text-slate-300">
                        <div className="flex items-start gap-3"><UserIcon className="h-5 w-5 mt-1 text-slate-500"/><div><p className="font-semibold">Your Agent</p><p>{keyInfo.agentName}</p><p>{keyInfo.agentContact}</p><p className="text-xs italic mt-1">{keyInfo.whatsAppNotes}</p></div></div>
                        <div className="flex items-start gap-3"><GlobeIcon className="h-5 w-5 mt-1 text-slate-500"/><div><p className="font-semibold">Ground Transport Manager</p><p>{keyInfo.groundTransportManager}</p></div></div>
                        <div className="flex items-start gap-3"><SimCardIcon className="h-5 w-5 mt-1 text-slate-500"/><div><label className="font-semibold">Your Local SIM Number</label><input type="text" value={localSim} onChange={(e) => setLocalSim(e.target.value)} placeholder="Enter your local number" className="w-full mt-1 p-1 border rounded text-black dark:bg-gray-800 dark:border-gray-600 dark:text-white" /></div></div>
                        <div className="flex items-start gap-3"><MailIcon className="h-5 w-5 mt-1 text-slate-500"/><div><label className="font-semibold">Your Email Address</label><input type="email" value={localEmail} onChange={(e) => setLocalEmail(e.target.value)} placeholder="Enter your email" className={`w-full mt-1 p-1 border rounded text-black dark:bg-gray-800 dark:border-gray-600 dark:text-white ${!isEmailEditable ? 'bg-gray-200 dark:bg-gray-700' : ''}`} disabled={!isEmailEditable} /></div></div>
                    </div>
                    <button onClick={handleSaveContactInfo} className="mt-4 bg-slate-600 text-white font-semibold py-1 px-3 rounded-lg hover:bg-slate-700 dark:bg-slate-500 dark:hover:bg-slate-400">Save My Info</button>
                </div>

                {/* --- Checklist --- */}
                {checklist.length > 0 && (<div className="mb-8"><div className="flex justify-between items-center mb-4"><h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">Your Pre-Travel Checklist</h2><button onClick={() => setIsChecklistVisible(!isChecklistVisible)} className="text-sm font-semibold text-red-800 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300">{isChecklistVisible ? 'Hide' : 'Show'}</button></div>{isChecklistVisible && (<div className="bg-slate-50 dark:bg-slate-700 p-4 rounded-lg border border-slate-200 dark:border-slate-600 space-y-3">{checklist.map(item => (<label key={item.id} className="flex items-center cursor-pointer p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"><input type="checkbox" checked={item.completed} onChange={() => handleChecklistItemToggle(item.id)} className="h-5 w-5 rounded border-gray-300 text-red-600 focus:ring-red-500" /><span className={`ml-3 text-gray-700 dark:text-gray-300 ${item.completed ? 'line-through text-gray-500 dark:text-gray-400' : ''}`}>{item.text}</span></label>))}</div>)}</div>)}
                
                {/* --- Documents Section with Card layout --- */}
                <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-4">Your Documents</h2>
                {visibleCategories.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {visibleCategories.map(category => (
                            <div key={category.name} className="bg-slate-50 dark:bg-slate-700 p-4 rounded-lg border border-slate-200 dark:border-slate-600">
                                <h3 className="font-bold text-lg mb-4">{category.icon} {category.name}</h3>
                                <div className="space-y-2">
                                    {customer.documents.filter(doc => doc.category === category.name).map(file => (
                                        <div key={file.id} className="bg-white dark:bg-gray-800 p-3 rounded-lg border dark:border-gray-700 flex justify-between items-center">
                                            <div className="flex items-center truncate">
                                                <FileIcon className="h-5 w-5 mr-3 flex-shrink-0 text-gray-500" />
                                                <span className="truncate font-medium text-gray-800 dark:text-gray-200">{file.name}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => setPreviewFile(file)} className="flex items-center bg-gray-200 text-gray-800 font-semibold py-1 px-3 rounded-lg hover:bg-gray-300 transition-colors text-sm dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"><PreviewIcon className="h-4 w-4 mr-2" />Preview</button>
                                                <a href={file.url} download className="flex items-center bg-red-800 text-white font-semibold py-1 px-3 rounded-lg hover:bg-red-700 transition-colors text-sm"><DownloadIcon className="h-4 w-4 mr-2" />Download</a>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (<div className="text-center py-12"><p className="text-gray-500">No documents have been uploaded for you yet.</p></div>)}

                {/* --- Footer and Expiry Notice --- */}
                <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-center text-sm text-gray-500 bg-slate-50 dark:bg-slate-700 p-3 rounded-lg">
                        <InfoIcon className="h-5 w-5 mr-3 flex-shrink-0" />
                        For your security, access to this portal will expire on {getExpiryDate()}. Please download any documents you wish to keep.
                    </div>
                    <p className="text-center text-xs text-gray-400 mt-4">Last Updated: {getLastUpdatedDate()}</p>
                </div>
            </div>

            {/* --- Preview Modal (no changes) --- */}
            {previewFile && (<div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50"><div className="bg-white rounded-lg shadow-2xl w-full h-full max-w-4xl max-h-[90vh] flex flex-col"><div className="flex justify-between items-center p-4 border-b flex-shrink-0"><h3 className="font-bold text-lg truncate">{previewFile.name}</h3><button onClick={() => setPreviewFile(null)} className="text-gray-400 hover:text-gray-800"><XIcon className="h-6 w-6" /></button></div><div className="flex-grow p-2">{previewFile.url.toLowerCase().endsWith('.jpg') ? (<img src={previewFile.url} alt="Document Preview" className="w-full h-full object-contain" />) : (<iframe src={previewFile.url} title="Document Preview" className="w-full h-full border-0"></iframe>)}</div></div></div>)}
        </>
    );
};

// --- Main Portal Component (no changes to logic) ---
export default function ClientPortal() {
    const [loggedInCustomer, setLoggedInCustomer] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const handleLogin = (customer) => { setLoggedInCustomer(customer); };
    const handleLogout = () => { setLoggedInCustomer(null); };
    const handleCustomerUpdate = (updatedData) => { setLoggedInCustomer(updatedData); };
    return (<div className="bg-slate-50 dark:bg-slate-900 min-h-screen flex items-center justify-center p-4"><div className="w-full max-w-5xl">{isLoading ? (<div className="text-center"><p className="text-gray-500">Loading...</p></div>) : loggedInCustomer ? (<ClientDashboard customer={loggedInCustomer} onLogout={handleLogout} onCustomerUpdate={handleCustomerUpdate} />) : (<ClientLoginPage onLogin={handleLogin} setIsLoading={setIsLoading} />)}</div></div>);
}
