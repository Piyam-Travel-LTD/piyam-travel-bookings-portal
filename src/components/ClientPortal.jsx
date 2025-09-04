import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs } from "firebase/firestore";
import { piyamTravelLogoBase64 } from '../data';

// ... (SVG Icons and ClientLoginPage remain the same) ...
const UserIcon = ({ className }) => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg> );
const FingerprintIcon = ({ className }) => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 10a2 2 0 0 0-2 2c0 1.02.5 2.51 2 4 .5-1.5.5-2.5 2-4a2 2 0 0 0-2-2Z"/><path d="M12 2a10 10 0 0 0-10 10c0 4.4 3.6 10 10 10s10-5.6 10-10A10 10 0 0 0 12 2Z"/></svg> );
const FileIcon = ({ className }) => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg> );
const DownloadIcon = ({ className }) => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> );
const InfoIcon = ({ className }) => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg> );
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
            const customersRef = collection(db, "customers");
            const q = query(customersRef, 
                where("referenceNumber", "==", `PT-${refNumber.trim().toUpperCase()}`), 
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
            console.error("Login error:", err);
            setError("An error occurred. Please check your connection and try again.");
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
                <div><h1 className="text-2xl
