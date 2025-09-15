import React, { useState, useMemo, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { collection, getDocs, addDoc, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { packageTypes, fileCategories, clientPortalUrl } from '../data';
import { SearchIcon, PlusIcon, ArrowLeftIcon, XIcon, FileIcon, LogOutIcon, TrashIcon, ArchiveIcon, NotesIcon } from './Icons';
import CreateFolderModal from './modals/CreateFolderModal';
import VoucherModal from './modals/VoucherModal';
import DeleteFolderModal from './modals/DeleteFolderModal';
import NotesModal from './modals/NotesModal';
import ExtendAccessModal from './modals/ExtendAccessModal';

export default function AgentDashboard({ onLogout }) {
    const [customers, setCustomers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
    const [isExtendModalOpen, setIsExtendModalOpen] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [newCustomerFirstName, setNewCustomerFirstName] = useState('');
    const [newCustomerLastName, setNewCustomerLastName] = useState('');
    const [newPackageType, setNewPackageType] = useState(packageTypes[0]);
    const [newDestination, setNewDestination] = useState('');
    const [keyInfo, setKeyInfo] = useState({ agentContact: '', groundContact: '', hotelAddress: '' });
    const [newNote, setNewNote] = useState('');
    const [newChecklistItem, setNewChecklistItem] = useState('');
    const [copySuccess, setCopySuccess] = useState('');
    const fileInputRef = useRef(null);
    const [currentUploadCategory, setCurrentUploadCategory] = useState('');
    const [uploadingStatus, setUploadingStatus] = useState({});
    const [showArchived, setShowArchived] = useState(false);

    const updateCustomerState = (updatedCustomer) => {
        const updatedCustomers = customers.map(c => c.id === updatedCustomer.id ? updatedCustomer : c);
        setCustomers(updatedCustomers);
        setSelectedCustomer(updatedCustomer);
    };

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

    useEffect(() => {
        if (selectedCustomer) {
            setKeyInfo(selectedCustomer.keyInformation || { agentContact: '', groundContact: '', hotelAddress: '' });
        }
    }, [selectedCustomer]);

    // --- THIS IS THE CORRECTED, ROBUST DATE FORMATTING FUNCTION ---
    const formatTimestamp = (timestamp) => {
        if (!timestamp) return 'N/A';
        // Handle both Firebase Timestamp objects and JS Date objects
        if (timestamp.toDate) { 
            return timestamp.toDate().toLocaleString('en-GB');
        }
        if (timestamp instanceof Date) {
            return timestamp.toLocaleString('en-GB');
        }
        return 'Invalid Date';
    };

    const generateRefNum = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = 'PT-';
        for (let i = 0; i < 6; i++) { result += chars.charAt(Math.floor(Math.random() * chars.length)); }
        return result;
    };

    const newCustomerRef = useMemo(() => generateRefNum(), [isCreateModalOpen]);

    const handleCopy = (textToCopy, message) => { navigator.clipboard.writeText(textToCopy).then(() => { setCopySuccess(message); setTimeout(() => setCopySuccess(''), 2000); }); };

    const handleCreateCustomer = async () => {
        if (newCustomerFirstName.trim() && newCustomerLastName.trim()) {
            const newCustomerData = {
                firstName: newCustomerFirstName.trim(),
                lastName: newCustomerLastName.trim(),
                lastName_lowercase: newCustomerLastName.trim().toLowerCase(),
                packageType: newPackageType,
                destination: newDestination.trim(),
                referenceNumber: newCustomerRef,
                documents: [],
                itinerary: [],
                notes: [],
                checklist: [],
                keyInformation: { agentContact: '', groundContact: '', hotelAddress: '' },
                status: 'In Progress',
                isArchived: false,
                createdAt: serverTimestamp(),
                lastUpdatedAt: serverTimestamp(),
            };
            try {
                const docRef = await addDoc(collection(db, "customers"), newCustomerData);
                const newCustomer = { id: docRef.id, ...newCustomerData };
                setCustomers([newCustomer, ...customers]);
                setNewCustomerFirstName('');
                setNewCustomerLastName('');
                setNewPackageType(packageTypes[0]);
                setNewDestination('');
                setIsCreateModalOpen(false);
                setSelectedCustomer(newCustomer);
            } catch (error) { console.error("Error adding document: ", error); }
        }
    };
    
    const handleFileChange = async (event) => {
        const files = Array.from(event.target.files);
        if (files.length === 0 || !selectedCustomer) return;
        
        let newDocuments = [];
        let failedUploads = 0;
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            setUploadingStatus(prev => ({...prev, [currentUploadCategory]: `Uploading ${i + 1} of ${files.length}...`}));
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
                newDocuments.push({
                    id: Date.now() + i, 
                    category: currentUploadCategory,
                    name: file.name,
                    url: publicUrl,
                    fileKey: fileKey,
                });
            } catch (error) {
                console.error(`Failed to upload ${file.name}:`, error);
                failedUploads++;
            }
        }
        if (newDocuments.length > 0) {
            const updatedDocuments = [...(selectedCustomer.documents || []), ...newDocuments];
            const customerDocRef = doc(db, "customers", selectedCustomer.id);
            await updateDoc(customerDocRef, { documents: updatedDocuments, lastUpdatedAt: serverTimestamp() });
            updateCustomerState({ ...selectedCustomer, documents: updatedDocuments, lastUpdatedAt: { toDate: () => new Date() } });
        }
        if (failedUploads > 0) {
             setUploadingStatus(prev => ({...prev, [currentUploadCategory]: `${failedUploads} file(s) failed!`}));
        } else {
            setUploadingStatus(prev => ({...prev, [currentUploadCategory]: ''}));
        }
        event.target.value = null; 
    };
    
    const handleDeleteFile = async (fileToDelete) => {
        if (!fileToDelete || !fileToDelete.fileKey) { console.error("Missing file key."); return; }
        if (fileToDelete.fileKey.startsWith('_templates/')) {
             const updatedDocuments = selectedCustomer.documents.filter(doc => doc.id !== fileToDelete.id);
            const customerDocRef = doc(db, "customers", selectedCustomer.id);
            await updateDoc(customerDocRef, { documents: updatedDocuments, lastUpdatedAt: serverTimestamp() });
            updateCustomerState({ ...selectedCustomer, documents: updatedDocuments, lastUpdatedAt: { toDate: () => new Date() } });
            return;
        }
        try {
            await fetch('/api/delete-file', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fileKey: fileToDelete.fileKey }),
            });
            const updatedDocuments = selectedCustomer.documents.filter(doc => doc.id !== fileToDelete.id);
            const customerDocRef = doc(db, "customers", selectedCustomer.id);
            await updateDoc(customerDocRef, { documents: updatedDocuments, lastUpdatedAt: serverTimestamp() });
            updateCustomerState({ ...selectedCustomer, documents: updatedDocuments, lastUpdatedAt: { toDate: () => new Date() } });
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

    const handleToggleStatus = async () => {
        const newStatus = selectedCustomer.status === 'Completed' ? 'In Progress' : 'Completed';
        const customerDocRef = doc(db, "customers", selectedCustomer.id);
        await updateDoc(customerDocRef, { status: newStatus, lastUpdatedAt: serverTimestamp() });
        updateCustomerState({ ...selectedCustomer, status: newStatus, lastUpdatedAt: { toDate: () => new Date() } });
    };

    const handleExtendAccess = async (months) => {
        const newExpiryDate = new Date();
        newExpiryDate.setMonth(newExpiryDate.getMonth() + months);
        const customerDocRef = doc(db, "customers", selectedCustomer.id);
        await updateDoc(customerDocRef, { 
            accessExpiresAt: newExpiryDate, 
            lastUpdatedAt: serverTimestamp() 
        });
        updateCustomerState({ ...selectedCustomer, accessExpiresAt: newExpiryDate, lastUpdatedAt: { toDate: () => new Date() }});
        setIsExtendModalOpen(false);
        alert(`Customer access has been extended until ${newExpiryDate.toLocaleDateString()}.`);
    };

    const handleToggleArchive = async () => {
        const newArchiveStatus = !selectedCustomer.isArchived;
        const customerDocRef = doc(db, "customers", selectedCustomer.id);
        await updateDoc(customerDocRef, { isArchived: newArchiveStatus, lastUpdatedAt: serverTimestamp() });
        updateCustomerState({ ...selectedCustomer, isArchived: newArchiveStatus, lastUpdatedAt: { toDate: () => new Date() } });
    };

    const handleAddNote = async () => {
        if (!newNote.trim()) return;
        const note = {
            text: newNote.trim(),
            timestamp: new Date().toISOString(),
            agent: 'Agent Name' 
        };
        const updatedNotes = [...(selectedCustomer.notes || []), note];
        const customerDocRef = doc(db, "customers", selectedCustomer.id);
        await updateDoc(customerDocRef, { notes: updatedNotes, lastUpdatedAt: serverTimestamp() });
        updateCustomerState({ ...selectedCustomer, notes: updatedNotes, lastUpdatedAt: { toDate: () => new Date() } });
        setNewNote('');
    };
    
    const handleUpdateKeyInfo = async () => {
        const customerDocRef = doc(db, "customers", selectedCustomer.id);
        await updateDoc(customerDocRef, { keyInformation: keyInfo, lastUpdatedAt: serverTimestamp() });
        updateCustomerState({ ...selectedCustomer, keyInformation: keyInfo, lastUpdatedAt: { toDate: () => new Date() } });
        alert("Key information saved!");
    };
    
    const handleAddChecklistItem = async () => {
        if (!newChecklistItem.trim()) return;
        const item = { id: Date.now(), text: newChecklistItem.trim(), completed: false };
        const updatedChecklist = [...(selectedCustomer.checklist || []), item];
        const customerDocRef = doc(db, "customers", selectedCustomer.id);
        await updateDoc(customerDocRef, { checklist: updatedChecklist, lastUpdatedAt: serverTimestamp() });
        updateCustomerState({ ...selectedCustomer, checklist: updatedChecklist, lastUpdatedAt: { toDate: () => new Date() } });
        setNewChecklistItem('');
    };

    const handleDeleteChecklistItem = async (itemId) => {
        const updatedChecklist = selectedCustomer.checklist.filter(item => item.id !== itemId);
        const customerDocRef = doc(db, "customers", selectedCustomer.id);
        await updateDoc(customerDocRef, { checklist: updatedChecklist, lastUpdatedAt: serverTimestamp() });
        updateCustomerState({ ...selectedCustomer, checklist: updatedChecklist, lastUpdatedAt: { toDate: () => new Date() } });
    };

    const handleQuickAdd = async (templateDoc) => {
        const newDocument = {
            id: Date.now(),
            category: templateDoc.category,
            name: templateDoc.name,
            url: `${R2_PUBLIC_URL}/${templateDoc.fileKey}`,
            fileKey: templateDoc.fileKey,
        };
        const updatedDocuments = [...(selectedCustomer.documents || []), newDocument];
        const customerDocRef = doc(db, "customers", selectedCustomer.id);
        await updateDoc(customerDocRef, { documents: updatedDocuments, lastUpdatedAt: serverTimestamp() });
        updateCustomerState({ ...selectedCustomer, documents: updatedDocuments, lastUpdatedAt: { toDate: () => new Date() } });
    };

    const handleUploadButtonClick = (category) => {
        setCurrentUploadCategory(category);
        fileInputRef.current.click();
    };

    const filteredCustomers = customers
        .filter(customer => showArchived ? true : !customer.isArchived)
        .filter(customer =>
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
            <div className="flex justify-between items-center mb-6">
                <div className="relative flex-grow">
                    <input type="text" placeholder="Search by name or reference number..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-red-800 focus:border-red-800" />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><SearchIcon /></div>
                </div>
                <label className="ml-4 flex items-center cursor-pointer">
                    <input type="checkbox" checked={showArchived} onChange={() => setShowArchived(!showArchived)} className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500" />
                    <span className="ml-2 text-sm text-gray-600">Show Archived</span>
                </label>
            </div>
            {isLoading ? <p className="text-center text-gray-500">Loading customers...</p> : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {filteredCustomers.map(customer => (
                    <div key={customer.id} onClick={() => setSelectedCustomer(customer)} className={`aspect-square p-4 rounded-lg border hover:border-red-800 cursor-pointer transition-all flex flex-col items-center justify-center text-center ${customer.isArchived ? 'bg-gray-200 border-gray-300' : 'bg-gray-50 border-gray-200 hover:bg-red-50'}`}>
                        <p className="font-bold text-lg text-gray-800 break-words">{customer.firstName} {customer.lastName}</p>
                        <p className="text-sm text-gray-500 mt-1">{customer.referenceNumber}</p>
                        <p className="text-xs text-gray-400 mt-1">{customer.packageType} - {customer.destination}</p>
                        {customer.status === 'Completed' && <span className="mt-2 text-xs font-bold text-green-800 bg-green-200 px-2 py-1 rounded-full">Completed</span>}
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
                    <div>
                        <div className="flex items-center gap-4">
                            <h1 className="text-3xl font-bold text-gray-800">{selectedCustomer.firstName} {selectedCustomer.lastName}</h1>
                            {selectedCustomer.status === 'Completed' && <span className="text-sm font-bold text-green-800 bg-green-200 px-3 py-1 rounded-full">Completed</span>}
                        </div>
                        <p className="text-gray-500 mt-1 font-mono">{selectedCustomer.referenceNumber}</p>
                         <p className="text-gray-600 mt-1 font-semibold">{selectedCustomer.packageType} to {selectedCustomer.destination}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button onClick={() => setIsNotesModalOpen(true)} className="flex items-center justify-center bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"><NotesIcon/>Internal Notes</button>
                        <button onClick={() => setIsVoucherModalOpen(true)} className="bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-lg hover:bg-gray-300">Generate Access Voucher</button>
                        <button onClick={() => setIsDeleteModalOpen(true)} className="flex items-center justify-center bg-red-100 text-red-800 font-semibold py-2 px-4 rounded-lg hover:bg-red-200 transition-colors"><TrashIcon/>Delete Folder</button>
                    </div>
                </div>
                <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Key Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                            <label className="font-semibold text-gray-600">Your Contact:</label>
                            <input type="text" value={keyInfo.agentContact} onChange={(e) => setKeyInfo({...keyInfo, agentContact: e.target.value})} placeholder="e.g., Hasnain @ +44..." className="w-full mt-1 p-1 border rounded"/>
                        </div>
                         <div>
                            <label className="font-semibold text-gray-600">Ground Contact:</label>
                            <input type="text" value={keyInfo.groundContact} onChange={(e) => setKeyInfo({...keyInfo, groundContact: e.target.value})} placeholder="e.g., Qari Latif @ +966..." className="w-full mt-1 p-1 border rounded"/>
                        </div>
                        <div className="md:col-span-2">
                             <label className="font-semibold text-gray-600">First Hotel Address:</label>
                             <textarea value={keyInfo.hotelAddress} onChange={(e) => setKeyInfo({...keyInfo, hotelAddress: e.target.value})} placeholder="e.g., Makkah Towers, Ibrahim Al Khalil St..." className="w-full mt-1 p-1 border rounded" rows="2"></textarea>
                        </div>
                    </div>
                    <button onClick={handleUpdateKeyInfo} className="mt-2 bg-yellow-500 text-white font-semibold py-1 px-3 rounded-lg hover:bg-yellow-600">Save Key Info</button>
                </div>
                <div className="mb-8">
                    <h2 className="text-2xl font-semibold text-gray-800 mb-4">Pre-Travel Checklist</h2>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <div className="space-y-2">
                             {(selectedCustomer.checklist || []).map(item => (
                                <div key={item.id} className="flex items-center justify-between bg-white p-2 rounded">
                                    <span className="text-gray-700">{item.text}</span>
                                    <button onClick={() => handleDeleteChecklistItem(item.id)} className="text-gray-400 hover:text-red-600"><XIcon className="h-4 w-4"/></button>
                                </div>
                             ))}
                        </div>
                        <div className="flex gap-2 mt-4">
                            <input type="text" value={newChecklistItem} onChange={e => setNewChecklistItem(e.target.value)} placeholder="Add new checklist item..." className="flex-grow w-full border border-gray-300 rounded-lg p-2"/>
                            <button onClick={handleAddChecklistItem} className="bg-red-800 text-white font-semibold py-2 px-4 rounded-lg hover:bg-red-700">Add</button>
                        </div>
                    </div>
                </div>
                 <div className="mb-8">
                    <h2 className="text-2xl font-semibold text-gray-800 mb-4">Quick Add Common Documents</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {templateDocuments.map(template => (
                            <button key={template.name} onClick={() => handleQuickAdd(template)} className="bg-gray-200 text-gray-800 text-sm font-semibold p-2 rounded-lg hover:bg-gray-300 transition-colors">
                                {template.name}
                            </button>
                        ))}
                    </div>
                 </div>
                 <h2 className="text-2xl font-semibold text-gray-800 mb-4">Documents</h2>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".pdf,.jpg" multiple />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {fileCategories.map(category => {
                         const filesInCategory = customerDocs.filter(doc => doc.category === category.name);
                        return (
                            <div key={category.name} className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex flex-col">
                                <h3 className="font-bold text-lg mb-3">{category.icon} {category.name}</h3>
                                <div className="space-y-2 flex-grow min-h-[50px]">
                                    {filesInCategory.length > 0 ? (
                                        filesInCategory.map(file => (
                                            <div key={file.id} className="bg-white p-2 rounded-md border flex justify-between items-center text-sm">
                                                <div className="flex items-center truncate"><FileIcon className="h-4 w-4 mr-2 flex-shrink-0 text-gray-500" /><span className="truncate">{file.name}</span></div>
                                                <button onClick={() => handleDeleteFile(file)} className="text-gray-400 hover:text-red-600 flex-shrink-0 ml-2"><XIcon className="h-4 w-4"/></button>
                                            </div>
                                        ))
                                    ) : ( <p className="text-sm text-gray-400 italic">No documents uploaded.</p> )}
                                </div>
                                 <button onClick={() => handleUploadButtonClick(category.name)} disabled={!!uploadingStatus[category.name]} className="w-full mt-4 bg-white border border-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-lg hover:bg-gray-100 transition-colors text-sm disabled:bg-gray-200 disabled:cursor-not-allowed">{uploadingStatus[category.name] || 'Upload Files'}</button>
                            </div>
                        )
                    })}
                </div>
                <div className="mt-6 pt-6 border-t border-gray-200 space-y-4">
                     <h3 className="text-lg font-semibold text-gray-800">Folder Management</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <button onClick={handleToggleStatus} className={`font-semibold py-2 px-4 rounded-lg transition-colors ${selectedCustomer.status === 'Completed' ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' : 'bg-green-100 text-green-800 hover:bg-green-200'}`}>{selectedCustomer.status === 'Completed' ? 'Mark as In Progress' : 'Mark as Completed'}</button>
                        <button onClick={() => setIsExtendModalOpen(true)} className="bg-blue-100 text-blue-800 font-semibold py-2 px-4 rounded-lg hover:bg-blue-200 transition-colors">Extend Access</button>
                        <button onClick={handleToggleArchive} className="flex items-center justify-center bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"><ArchiveIcon/>{selectedCustomer.isArchived ? 'Unarchive Folder' : 'Archive Folder'}</button>
                    </div>
                </div>
                 <div className="mt-4 text-center text-xs text-gray-400">
                    Last Updated: {formatTimestamp(selectedCustomer.lastUpdatedAt)}
                </div>
            </div>
        );
    }
    
    // --- THIS IS THE CORRECTED RETURN STATEMENT ---
    return (
        <div className="bg-gray-100 min-h-screen p-4 md:p-8">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept=".pdf,.jpg"
                multiple
            />

            {selectedCustomer ? renderCustomerFolder() : renderDashboard()}

            <CreateFolderModal 
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                handleCreateCustomer={handleCreateCustomer}
                newCustomerFirstName={newCustomerFirstName}
                setNewCustomerFirstName={setNewCustomerFirstName}
                newCustomerLastName={newCustomerLastName}
                setNewCustomerLastName={setNewCustomerLastName}
                newPackageType={newPackageType}
                setNewPackageType={setNewPackageType}
                newDestination={newDestination}
                setNewDestination={setNewDestination}
                newCustomerRef={newCustomerRef}
            />
            <VoucherModal
                isOpen={isVoucherModalOpen}
                onClose={() => setIsVoucherModalOpen(false)}
                customer={selectedCustomer}
                handleCopy={handleCopy}
                copySuccess={copySuccess}
            />
            <DeleteFolderModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                deleteConfirmText={deleteConfirmText}
                setDeleteConfirmText={setDeleteConfirmText}
                handleDeleteFolder={handleDeleteFolder}
            />
            <NotesModal
                isOpen={isNotesModalOpen}
                onClose={() => setIsNotesModalOpen(false)}
                customer={selectedCustomer}
                newNote={newNote}
                setNewNote={setNewNote}
                handleAddNote={handleAddNote}
            />
            <ExtendAccessModal
                isOpen={isExtendModalOpen}
                onClose={() => setIsExtendModalOpen(false)}
                handleExtendAccess={handleExtendAccess}
            />
        </div>
    );
}
