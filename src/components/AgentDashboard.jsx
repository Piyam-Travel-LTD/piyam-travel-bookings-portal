import React, { useState, useMemo, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { collection, getDocs, addDoc, doc, updateDoc } from "firebase/firestore";
import { piyamTravelLogoBase64, clientPortalUrl } from '../data';
import QRCode from 'qrcode.react';

// --- (All SVG components and constants remain the same) ---
const SearchIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-gray-400"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg> );
const PlusIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 mr-2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg> );
const ArrowLeftIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 mr-2"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg> );
const XIcon = ({ className }) => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg> );
const CopyIcon = ({ className }) => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg> );
const LinkIcon = ({ className }) => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.72"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.72-1.72"></path></svg> );
const FileIcon = ({ className }) => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg> );
const LogOutIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 mr-2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg> );
const TrashIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 mr-2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg> );

const fileCategories = [ { name: 'Flights', icon: '✈️' }, { name: 'Hotels', icon: '🏨' }, { name: 'Transport', icon: '🚗' }, { name: 'Visa', icon: '📄' }, { name: 'E-Sim', icon: '📱' }, { name: 'Insurance', icon: '🛡️' }, { name: 'Others', icon: '📎' }, ];

export default function AgentDashboard({ onLogout }) {
    const [customers, setCustomers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [newCustomerFirstName, setNewCustomerFirstName] = useState('');
    const [newCustomerLastName, setNewCustomerLastName] = useState('');
    const [copySuccess, setCopySuccess] = useState('');
    const fileInputRef = useRef(null);
    const [currentUploadCategory, setCurrentUploadCategory] = useState('');
    const [uploadingStatus, setUploadingStatus] = useState({});

    useEffect(() => {
        const fetchCustomers = async () => {
            setIsLoading(true);
            try {
                const customersCollection = collection(db, "customers");
                const customerSnapshot = await getDocs(customersCollection);
                const customerList = customerSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setCustomers(customerList);
            } catch (error) { console.error("Error fetching customers: ", error); } 
            finally { setIsLoading(false); }
        };
        fetchCustomers();
    }, []);

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
        });
    };

    const handleCreateCustomer = async () => {
        if (newCustomerFirstName.trim() && newCustomerLastName.trim()) {
            const newCustomerData = {
                firstName: newCustomerFirstName.trim(),
                lastName: newCustomerLastName.trim(),
                lastName_lowercase: newCustomerLastName.trim().toLowerCase(),
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
        setUploadingStatus(prev => ({...prev, [currentUploadCategory]: 'Uploading...'}));
        try {
            const urlResponse = await fetch('/api/generate-upload-url', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fileName: file.name, customerId: selectedCustomer.id }),
            });
            if (!urlResponse.ok) throw new Error('Could not get upload URL.');
            const { uploadUrl, publicUrl, fileKey } = await urlResponse.json();
            const uploadResponse = await fetch(uploadUrl, {
                method: 'PUT',
                body: file,
                headers: { 'Content-Type': file.type },
            });
            if (!uploadResponse.ok) throw new Error('File upload failed.');
            const newDocument = {
                id: Date.now(),
                category: currentUploadCategory,
                name: file.name,
                url: publicUrl,
                fileKey: fileKey,
            };
            const updatedDocuments = [...(selectedCustomer.documents || []), newDocument];
            const customerDocRef = doc(db, "customers", selectedCustomer.id);
            await updateDoc(customerDocRef, { documents: updatedDocuments });
            const updatedCustomer = { ...selectedCustomer, documents: updatedDocuments };
            const updatedCustomers = customers.map(c => c.id === selectedCustomer.id ? updatedCustomer : c);
            setCustomers(updatedCustomers);
            setSelectedCustomer(updatedCustomer);
             setUploadingStatus(prev => ({...prev, [currentUploadCategory]: ''}));
        } catch (error) {
            console.error("File upload process failed:", error);
            setUploadingStatus(prev => ({...prev, [currentUploadCategory]: 'Upload Failed!'}));
        }
        event.target.value = null;
    };
    
    const handleDeleteFile = async (fileToDelete) => {
        if (!fileToDelete || !fileToDelete.fileKey) { console.error("Missing file key."); return; }
        try {
            await fetch('/api/delete-file', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fileKey: fileToDelete.fileKey }),
            });
            const updatedDocuments = selectedCustomer.documents.filter(doc => doc.id !== fileToDelete.id);
            const customerDocRef = doc(db, "customers", selectedCustomer.id);
            await updateDoc(customerDocRef, { documents: updatedDocuments });
            const updatedCustomer = { ...selectedCustomer, documents: updatedDocuments };
            const updatedCustomers = customers.map(c => c.id === selectedCustomer.id ? updatedCustomer : c);
            setCustomers(updatedCustomers);
            setSelectedCustomer(updatedCustomer);
        } catch(error) { console.error("Error deleting file:", error); }
    };

    const handleDeleteFolder = async () => {
        if (deleteConfirmText !== 'Delete') return;
        try {
            await fetch('/api/delete-customer-folder', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ customerId: selectedCustomer.id }),
            });
            setCustomers(customers.filter(c => c.id !== selectedCustomer.id));
            setSelectedCustomer(null);
            setIsDeleteModalOpen(false);
            setDeleteConfirmText('');
        } catch (error) {
            console.error("Error deleting folder:", error);
        }
    };

    const handleUploadButtonClick = (category) => {
        setCurrentUploadCategory(category);
        fileInputRef.current.click();
    };

    const filteredCustomers = customers.filter(customer =>
        `${customer.firstName} ${customer.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (customer.referenceNumber && customer.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase()))
    );

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
                    <div className="flex gap-2">
                        <button onClick={() => setIsVoucherModalOpen(true)} className="w-full md:w-auto bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors">Generate Access Voucher</button>
                        <button onClick={() => setIsDeleteModalOpen(true)} className="flex items-center justify-center bg-red-100 text-red-800 font-semibold py-2 px-4 rounded-lg hover:bg-red-200 transition-colors"><TrashIcon/>Delete Folder</button>
                    </div>
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
                                                <button onClick={() => handleDeleteFile(file)} className="text-gray-400 hover:text-red-600 flex-shrink-0 ml-2"><XIcon className="h-4 w-4"/></button>
                                            </div>
                                        ))
                                    ) : ( <p className="text-sm text-gray-400 italic">No documents uploaded yet.</p> )}
                                </div>
                                 <button onClick={() => handleUploadButtonClick(category.name)} disabled={!!uploadingStatus[category.name]} className="w-full mt-4 bg-white border border-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-lg hover:bg-gray-100 transition-colors text-sm disabled:bg-gray-200 disabled:cursor-not-allowed">{uploadingStatus[category.name] || 'Upload File'}</button>
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
                            <div className="w-1/4 flex-shrink-0 flex items-center justify-center"><img src={piyamTravelLogoBase64} alt="Piyam Travel Logo" className="w-32 h-auto object-contain"/></div>
                            <div className="flex-grow text-center border-l border-r border-gray-200 px-6">
                                <p className="text-sm text-gray-500">Customer</p>
                                <p className="text-xl font-bold text-gray-900">{selectedCustomer.firstName} {selectedCustomer.lastName}</p>
                                <p className="text-sm text-gray-500 mt-4">Reference Number</p>
                                <p className="text-xl font-mono text-red-800 bg-red-50 border border-red-200 rounded-md px-2 py-1 inline-block">{selectedCustomer.referenceNumber}</p>
                                <p className="text-sm text-gray-500 mt-4">Login Website</p>
                                <p className="text-lg font-semibold text-gray-900">{clientPortalUrl.replace('https://', '')}</p>
                            </div>
                             <div className="w-1/4 flex-shrink-0 flex items-center justify-center">
                                <div className="p-2 bg-white border rounded-md shadow-sm">
                                    <QRCode value={clientPortalUrl} size={128} />
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                            <button onClick={() => handleCopy(clientPortalUrl, 'Link Copied!')} className="flex items-center justify-center w-full bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"><LinkIcon className="h-5 w-5 mr-2" />Copy Link</button>
                             <button 
                                onClick={() => handleCopy(
                                    `Dear ${selectedCustomer.firstName} ${selectedCustomer.lastName},\n\nYour travel documents are now available in your secure client portal. Please use the details below to log in:\n\nWebsite: ${clientPortalUrl}\nReference Number: ${selectedCustomer.referenceNumber}\nLast Name: ${selectedCustomer.lastName}\n\nKind regards,\nThe Piyam Travel Team`,
                                    'Details Copied!'
                                )}
                                className="flex items-center justify-center w-full bg-red-800 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-red-700 transition-colors">
                                <CopyIcon className="h-5 w-5 mr-2" />Copy Details as Text
                            </button>
                        </div>
                        {copySuccess && <p className="text-center text-green-600 font-semibold mt-4">{copySuccess}</p>}
                    </div>
                </div>
            )}
            {isDeleteModalOpen && selectedCustomer && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
                        <h2 className="text-2xl font-bold text-red-800 mb-2">Delete Customer Folder</h2>
                        <p className="text-gray-600 mb-4">This action is permanent and cannot be undone. All associated documents will be deleted from storage.</p>
                        <p className="text-sm text-gray-700">To confirm, please type **Delete** in the box below.</p>
                        <input 
                            type="text" 
                            value={deleteConfirmText}
                            onChange={(e) => setDeleteConfirmText(e.target.value)}
                            className="mt-2 w-full border border-gray-300 rounded-lg p-2 focus:ring-red-800 focus:border-red-800" 
                        />
                        <div className="flex justify-end gap-4 mt-6">
                            <button onClick={() => setIsDeleteModalOpen(false)} className="bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors">Cancel</button>
                            <button 
                                onClick={handleDeleteFolder} 
                                disabled={deleteConfirmText !== 'Delete'}
                                className="bg-red-800 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-red-700 transition-colors disabled:bg-red-300 disabled:cursor-not-allowed">
                                Permanently Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
