import React, { useState, useMemo, useEffect, useRef } from 'react';
import { getAuth } from "firebase/auth";
import { getFirestore, collection, getDocs, addDoc, doc, updateDoc } from "firebase/firestore";

// NOTE: We don't need to initialize Firebase here anymore, as it's done in App.jsx
const db = getFirestore();
const auth = getAuth();

// --- Components (QRCodeComponent and SVGs remain the same) ---
const QRCodeComponent = ({ value, size }) => {
    const ref = useRef(null);
    useEffect(() => {
        if (ref.current && window.QRCode) {
            ref.current.innerHTML = '';
            new window.QRCode(ref.current, {
                text: value,
                width: size,
                height: size,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: window.QRCode.CorrectLevel.H
            });
        }
    }, [value, size]);
    return <div ref={ref}></div>;
};

const SearchIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-gray-400"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg> );
const PlusIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 mr-2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg> );
const ArrowLeftIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 mr-2"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg> );
const XIcon = ({ className }) => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg> );
const CopyIcon = ({ className }) => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg> );
const LinkIcon = ({ className }) => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.72"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.72-1.72"></path></svg> );
const FileIcon = ({ className }) => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg> );
const LogOutIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 mr-2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg> );

const fileCategories = [ { name: 'Flights', icon: '✈️' }, { name: 'Hotels', icon: '🏨' }, { name: 'Transport', icon: '🚗' }, { name: 'Visa', icon: '📄' }, { name: 'E-Sim', icon: '📱' }, { name: 'Insurance', icon: '🛡️' }, { name: 'Others', icon: '📎' }, ];

export default function AgentDashboard({ onLogout }) {
    const [customers, setCustomers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
    const [newCustomerFirstName, setNewCustomerFirstName] = useState('');
    const [newCustomerLastName, setNewCustomerLastName] = useState('');
    const [copySuccess, setCopySuccess] = useState('');
    const fileInputRef = useRef(null);
    const [currentUploadCategory, setCurrentUploadCategory] = useState('');
    
    useEffect(() => {
        const fetchCustomers = async () => {
            setIsLoading(true);
            try {
                const customersCollection = collection(db, "customers");
                const customerSnapshot = await getDocs(customersCollection);
                const customerList = customerSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setCustomers(customerList);
            } catch (error) {
                console.error("Error fetching customers: ", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchCustomers();
    }, []);

    // ... (All other functions: generateRefNum, handleCopy, handleCreateCustomer, etc. remain the same)
    const generateRefNum = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = 'PT-';
        for (let i = 0; i < 6; i++) { result += chars.charAt(Math.floor(Math.random() * chars.length)); }
        return result;
    };

    const newCustomerRef = useMemo(() => generateRefNum(), [isCreateModalOpen]);

    const handleCopy = (textToCopy, message) => {
        navigator.clipboard.writeText(textToCopy).then(() => {
            setCopySuccess(message);
            setTimeout(() => setCopySuccess(''), 2000);
        }, (err) => {
            console.error('Could not copy text: ', err);
            setCopySuccess('Failed to copy!');
             setTimeout(() => setCopySuccess(''), 2000);
        });
    };

    const handleCreateCustomer = async () => {
        if (newCustomerFirstName.trim() && newCustomerLastName.trim()) {
            const newCustomerData = {
                firstName: newCustomerFirstName,
                lastName: newCustomerLastName,
                referenceNumber: newCustomerRef,
                documents: [],
                createdAt: new Date().toISOString(),
            };
            try {
                const docRef = await addDoc(collection(db, "customers"), newCustomerData);
                const newCustomer = { id: docRef.id, ...newCustomerData };
                setCustomers([newCustomer, ...customers]);
                setNewCustomerFirstName('');
                setNewCustomerLastName('');
                setIsCreateModalOpen(false);
                setSelectedCustomer(newCustomer);
            } catch (error) { console.error("Error adding document: ", error); }
        }
    };
    
    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        if (!file || !selectedCustomer) return;
        const newDocument = { id: Date.now(), category: currentUploadCategory, name: file.name };
        const updatedDocuments = [...(selectedCustomer.documents || []), newDocument];
        const customerDocRef = doc(db, "customers", selectedCustomer.id);
        try {
            await updateDoc(customerDocRef, { documents: updatedDocuments });
            const updatedCustomer = { ...selectedCustomer, documents: updatedDocuments };
            const updatedCustomers = customers.map(c => c.id === selectedCustomer.id ? updatedCustomer : c);
            setCustomers(updatedCustomers);
            setSelectedCustomer(updatedCustomer);
        } catch(error) { console.error("Error updating document: ", error); }
        event.target.value = null;
    };
    
    const handleDeleteFile = async (fileId) => {
         const updatedDocuments = selectedCustomer.documents.filter(doc => doc.id !== fileId);
         const customerDocRef = doc(db, "customers", selectedCustomer.id);
         try {
            await updateDoc(customerDocRef, { documents: updatedDocuments });
            const updatedCustomer = { ...selectedCustomer, documents: updatedDocuments };
            const updatedCustomers = customers.map(c => c.id === selectedCustomer.id ? updatedCustomer : c);
            setCustomers(updatedCustomers);
            setSelectedCustomer(updatedCustomer);
         } catch(error) { console.error("Error updating document: ", error); }
    }

    const handleUploadButtonClick = (category) => {
        setCurrentUploadCategory(category);
        fileInputRef.current.click();
    };

    const filteredCustomers = customers.filter(customer =>
        `${customer.firstName} ${customer.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (customer.referenceNumber && customer.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // --- Component Rendering ---
    
    const renderDashboard = () => (
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div><h1 className="text-3xl font-bold text-gray-800">Customer Folders</h1><p className="text-gray-500 mt-1">Manage all your client travel packages.</p></div>
                <div className="flex gap-4">
                    <button onClick={() => setIsCreateModalOpen(true)} className="flex items-center justify-center bg-red-800 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-red-700 transition-colors"><PlusIcon />Create New Folder</button>
                    <button onClick={onLogout} className="flex items-center justify-center bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-gray-500 transition-colors"><LogOutIcon/>Sign Out</button>
                </div>
            </div>
            <div className="relative mb-6">
                <input type="text" placeholder="Search by name or reference number..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-red-800 focus:border-red-800" />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><SearchIcon /></div>
            </div>
            {isLoading ? <p className="text-center text-gray-500">Loading customers...</p> : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {filteredCustomers.map(customer => (
                    <div key={customer.id} onClick={() => setSelectedCustomer(customer)} className="bg-gray-50 aspect-square p-4 rounded-lg border border-gray-200 hover:border-red-800 hover:bg-red-50 cursor-pointer transition-all flex flex-col items-center justify-center text-center">
                        <p className="font-bold text-lg text-gray-800 break-words">{customer.firstName} {customer.lastName}</p>
                        <p className="text-sm text-gray-500 mt-1">{customer.referenceNumber}</p>
                        <p className="text-xs text-gray-400 mt-2">{customer.documents?.length || 0} document(s)</p>
                    </div>
                ))}
            </div>
            )}
        </div>
    );
    
    const renderCustomerFolder = () => {
        const customerDocs = selectedCustomer.documents || [];
        return (
            <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
                <div className="flex items-center mb-6 border-b pb-4"><button onClick={() => setSelectedCustomer(null)} className="flex items-center text-gray-600 hover:text-gray-900 font-semibold transition-colors"><ArrowLeftIcon />Back</button></div>
                <div className="flex flex-col md:flex-row justify-between items-start mb-6 gap-4">
                    <div><h1 className="text-3xl font-bold text-gray-800">{selectedCustomer.firstName} {selectedCustomer.lastName}</h1><p className="text-gray-500 mt-1 font-mono">{selectedCustomer.referenceNumber}</p></div>
                    <button onClick={() => setIsVoucherModalOpen(true)} className="w-full md:w-auto bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors">Generate Access Voucher</button>
                </div>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".pdf,.jpg" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {fileCategories.map(category => {
                        const filesInCategory = customerDocs.filter(doc => doc.category === category.name);
                        return (
                            <div key={category.name} className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex flex-col">
                                <h3 className="font-bold text-lg mb-3">{category.icon} {category.name}</h3>
                                <div className="space-y-2 flex-grow">
                                    {filesInCategory.length > 0 ? (
                                        filesInCategory.map(file => (
                                            <div key={file.id} className="bg-white p-2 rounded-md border flex justify-between items-center text-sm">
                                                <div className="flex items-center truncate"><FileIcon className="h-4 w-4 mr-2 flex-shrink-0 text-gray-500" /><span className="truncate">{file.name}</span></div>
                                                <button onClick={() => handleDeleteFile(file.id)} className="text-gray-400 hover:text-red-600 flex-shrink-0 ml-2"><XIcon className="h-4 w-4"/></button>
                                            </div>
                                        ))
                                    ) : ( <p className="text-sm text-gray-400 italic">No documents uploaded yet.</p> )}
                                </div>
                                <button onClick={() => handleUploadButtonClick(category.name)} className="w-full mt-4 bg-white border border-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-lg hover:bg-gray-100 transition-colors text-sm">Upload File</button>
                            </div>
                        )
                    })}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-100 min-h-screen p-4 md:p-8">
            {selectedCustomer ? renderCustomerFolder() : renderDashboard()}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Create New Customer Folder</h2>
                        <p className="text-gray-500 mb-6">A unique reference number will be generated.</p>
                        <div className="space-y-4">
                            <div><label htmlFor="firstName" className="block text-sm font-medium text-gray-700">First Name</label><input type="text" id="firstName" value={newCustomerFirstName} onChange={(e) => setNewCustomerFirstName(e.target.value)} className="mt-1 w-full border border-gray-300 rounded-lg p-2 focus:ring-red-800 focus:border-red-800" /></div>
                            <div><label htmlFor="lastName" className="block text-sm font-medium text-gray-700">Last Name</label><input type="text" id="lastName" value={newCustomerLastName} onChange={(e) => setNewCustomerLastName(e.target.value)} className="mt-1 w-full border border-gray-300 rounded-lg p-2 focus:ring-red-800 focus:border-red-800" /></div>
                             <div><label className="block text-sm font-medium text-gray-700">Generated Reference Number</label><p className="mt-1 w-full border border-gray-200 bg-gray-50 rounded-lg p-2 font-mono text-gray-600">{newCustomerRef}</p></div>
                        </div>
                        <div className="flex justify-end gap-4 mt-8"><button onClick={() => setIsCreateModalOpen(false)} className="bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors">Cancel</button><button onClick={handleCreateCustomer} className="bg-red-800 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-red-700 transition-colors">Create Folder</button></div>
                    </div>
                </div>
            )}
             {isVoucherModalOpen && selectedCustomer && (
                 <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-3xl relative">
                        <button onClick={() => setIsVoucherModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-800"><XIcon className="h-6 w-6"/></button>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Share Customer Access</h2>
                        <p className="text-gray-500 mb-6">Share these details with your customer to access their portal.</p>
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 flex items-center gap-6">
                            <div className="w-1/4 flex-shrink-0 flex items-center justify-center"><img src="data:image/png;base64,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" alt="Piyam Travel Logo" className="w-32 h-auto object-contain"/></div>
                            <div className="flex-grow text-center border-l border-r border-gray-200 px-6">
                                <p className="text-sm text-gray-500">Customer</p>
                                <p className="text-xl font-bold text-gray-900">{selectedCustomer.firstName} {selectedCustomer.lastName}</p>
                                <p className="text-sm text-gray-500 mt-4">Reference Number</p>
                                <p className="text-xl font-mono text-red-800 bg-red-50 border border-red-200 rounded-md px-2 py-1 inline-block">{selectedCustomer.referenceNumber}</p>
                                <p className="text-sm text-gray-500 mt-4">Login Website</p>
                                <p className="text-lg font-semibold text-gray-900">portal.piyamtravel.com</p>
                            </div>
                             <div className="w-1/4 flex-shrink-0 flex items-center justify-center">
                                <div className="p-2 bg-white border rounded-md shadow-sm">
                                    <QRCodeComponent value="https://portal.piyamtravel.com" size={128} />
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                            <button onClick={() => handleCopy('https://portal.piyamtravel.com', 'Link Copied!')} className="flex items-center justify-center w-full bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"><LinkIcon className="h-5 w-5 mr-2" />Copy Link</button>
                             <button onClick={() => handleCopy( `Hello ${selectedCustomer.firstName} ${selectedCustomer.lastName},\n\nYour travel documents are ready. You can access your secure portal using the details below:\n\nWebsite: portal.piyamtravel.com\nReference Number: ${selectedCustomer.referenceNumber}\nLast Name: ${selectedCustomer.lastName}\n\nThank you,\nPiyam Travel`, 'Details Copied!')} className="flex items-center justify-center w-full bg-red-800 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-red-700 transition-colors"><CopyIcon className="h-5 w-5 mr-2" />Copy Details as Text</button>
                        </div>
                        {copySuccess && <p className="text-center text-green-600 font-semibold mt-4">{copySuccess}</p>}
                    </div>
                </div>
            )}
        </div>
    );
}
