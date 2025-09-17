import React, { useState } from 'react';
import { XIcon } from '../Icons';

export default function TransportVoucherModal({ isOpen, onClose, customer, onSave }) {
    const [formData, setFormData] = useState({
        bookingId: '', // <-- NEW FIELD
        passengers: '2 Adults, 0 Children',
        flightNumber: 'EK007',
        airports: 'LHR to JED',
        landingDate: '2025-09-15',
        landingTime: '22:30',
        pickupLocation: 'Jeddah Airport',
        dropoffLocation: 'Makkah Hotel',
        pickupDate: '2025-09-15',
        pickupTime: '22:45',
        maxBags: '4',
        extraBaggageFee: '200 SAR',
        providerName: 'Your Company Name',
        providerContact: 'Qari Abdul Latif @ +966...',
    });
    const [isSaving, setIsSaving] = useState(false);

    if (!isOpen) return null;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSaveClick = async () => {
        setIsSaving(true);
        await onSave(formData);
        setIsSaving(false);
        onClose();
    };
    
    // Custom labels for form fields
    const fieldLabels = {
        bookingId: 'Supplier Voucher No. (Internal)',
        passengers: 'Passenger Details (e.g., 2 Adults)',
        flightNumber: 'Flight Number',
        airports: 'Airports (e.g., LHR to JED)',
        landingDate: 'Landing Date',
        landingTime: 'Landing Time',
        pickupLocation: 'Pickup Location',
        dropoffLocation: 'Dropoff Location',
        pickupDate: 'Pickup Date',
        pickupTime: 'Pickup Time',
        maxBags: 'Max Bags',
        extraBaggageFee: 'Extra Baggage Fee',
        providerName: 'Provider Company Name',
        providerContact: 'Provider Contact Number',
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-2xl">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-gray-800">Create Transport Voucher</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-800"><XIcon className="h-6 w-6"/></button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm overflow-y-auto max-h-[60vh] p-2">
                    {Object.keys(formData).map(key => (
                         <div key={key} className={key === 'bookingId' ? 'md:col-span-2' : ''}>
                            <label className="block font-medium text-gray-700">{fieldLabels[key] || key}</label>
                            <input
                                type="text"
                                name={key}
                                value={formData[key]}
                                onChange={handleChange}
                                className="mt-1 w-full border border-gray-300 rounded-lg p-2 focus:ring-red-800 focus:border-red-800"
                            />
                        </div>
                    ))}
                </div>
                <div className="flex justify-end gap-4 mt-6">
                    <button onClick={onClose} className="bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-lg hover:bg-gray-300">Cancel</button>
                    <button onClick={handleSaveClick} disabled={isSaving} className="bg-red-800 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-red-700 disabled:bg-red-300">
                        {isSaving ? 'Saving...' : 'Generate & Save Voucher'}
                    </button>
                </div>
            </div>
        </div>
    );
}
