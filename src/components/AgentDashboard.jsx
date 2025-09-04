import React, { useState, useMemo, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { collection, getDocs, addDoc, doc, updateDoc } from "firebase/firestore";
import { piyamTravelLogoBase64 } from '../data'; // Import logo

// --- Components (QRCodeComponent and SVGs remain the same) ---
const QRCodeComponent = ({ value, size }) => {
    const ref = useRef(null);
    useEffect(() => {
        if (ref.current && window.QRCode) {
            ref.current.innerHTML = '';
            new window.QRCode(ref.current, { text: value, width: size, height: size, colorDark: "#000000", colorLight: "#ffffff", correctLevel: window.QRCode.CorrectLevel.H });
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
    // ... (rest of the state and functions remain the same)
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
    // ... (
