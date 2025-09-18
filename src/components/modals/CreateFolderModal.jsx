import React from 'react';
import { PlusIcon } from '../Icons';
import { packageTypes } from '../../data';

export default function CreateFolderModal({ 
    isOpen, 
    onClose, 
    handleCreateCustomer, 
    newCustomerFirstName, 
    setNewCustomerFirstName,
    newCustomerLastName,
    setNewCustomerLastName,
    newPackageType,
    setNewPackageType,
    newDestination,
    setNewDestination,
    newCustomerRef
}) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Create New Customer Folder</h2>
                <p className="text-gray-500 mb-6">Enter the customer and package details.</p>
                <div className="space-y-4">
                    <div><label htmlFor="firstName" className="block text-sm font-medium text-gray-700">First Name</label><input type="text" id="firstName" value={newCustomerFirstName} onChange={(e) => setNewCustomerFirstName(e.target.value)} className="mt-1 w-full border border-gray-300 rounded-lg p-2 focus:ring-red-800 focus:border-red-800" /></div>
                    <div><label htmlFor="lastName" className="block text-sm font-medium text-gray-700">Last Name</label><input type="text" id="lastName" value={newCustomerLastName} onChange={(e) => setNewCustomerLastName(e.target.value)} className="mt-1 w-full border border-gray-300 rounded-lg p-2 focus:ring-red-800 focus:border-red-800" /></div>
                    <div><label htmlFor="packageType" className="block text-sm font-medium text-gray-700">Package Type</label>
                        <select id="packageType" value={newPackageType} onChange={(e) => setNewPackageType(e.target.value)} className="mt-1 w-full border border-gray-300 rounded-lg p-2 focus:ring-red-800 focus:border-red-800">
                            {packageTypes.map(type => <option key={type} value={type}>{type}</option>)}
                        </select>
                    </div>
                    <div><label htmlFor="destination" className="block text-sm font-medium text-gray-700">Destination</label><input type="text" id="destination" value={newDestination} onChange={(e) => setNewDestination(e.target.value)} className="mt-1 w-full border border-gray-300 rounded-lg p-2 focus:ring-red-800 focus:border-red-800" /></div>
                    <div><label className="block text-sm font-medium text-gray-700">Generated Reference Number</label><p className="mt-1 w-full border border-gray-200 bg-gray-50 rounded-lg p-2 font-mono text-gray-600">{newCustomerRef}</p></div>
                </div>
                <div className="flex justify-end gap-4 mt-8">
                    <button onClick={onClose} className="bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors">Cancel</button>
                    <button onClick={handleCreateCustomer} className="bg-red-800 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-red-700 transition-colors">Create Folder</button>
                </div>
            </div>
        </div>
    );
}
