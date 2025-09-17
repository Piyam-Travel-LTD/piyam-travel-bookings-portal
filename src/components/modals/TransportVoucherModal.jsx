import React, { useState } from 'react';
import { XIcon } from '../Icons';

// A single, reusable component for an itinerary item
const ItineraryItem = ({ item, index, onUpdate, onRemove }) => {
    const handleChange = (e) => {
        onUpdate(index, { ...item, [e.target.name]: e.target.value });
    };

    return (
        <div className="bg-gray-100 p-3 rounded-lg border space-y-2">
            <div className="flex justify-between items-center">
                <p className="font-semibold text-gray-700">Segment #{index + 1}: {item.type}</p>
                <button type="button" onClick={() => onRemove(index)} className="text-red-500 hover:text-red-700 text-sm font-bold">Remove</button>
            </div>
            <input type="text" name="description" value={item.description} onChange={handleChange} placeholder="e.g., Makkah Hotel to Madinah Hotel" className="w-full border-gray-300 rounded-md shadow-sm text-sm" />
            <div className="grid grid-cols-2 gap-2">
                <input type="date" name="date" value={item.date} onChange={handleChange} className="w-full border-gray-300 rounded-md shadow-sm text-sm" />
                <input type="time" name="time" value={item.time} onChange={handleChange} className="w-full border-gray-300 rounded-md shadow-sm text-sm" />
            </div>
        </div>
    );
};

export default function TransportVoucherModal({ isOpen, onClose, customer, onSave }) {
    // Initial state setup
    const [formData, setFormData] = useState({
        bookingId: '',
        passengers: '2 Adults, 0 Children',
        flightNumber: 'EK007',
        airports: 'LHR to JED',
        landingDate: '2025-09-15',
        landingTime: '22:30',
        maxBags: '4',
        extraBaggageFee: '50 SAR per bag',
        providerName: 'Barakat AlMusafar Trading',
        providerContact: '+966555049005',
    });
    
    // State for the dynamic itinerary
    const [itinerary, setItinerary] = useState([
        { type: 'Airport Pickup', description: 'JED Airport to Makkah Hotel', date: '2025-09-15', time: '23:30' }
    ]);

    const [isSaving, setIsSaving] = useState(false);

    if (!isOpen) return null;

    const handleFormChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleItineraryChange = (index, updatedItem) => {
        const newItinerary = [...itinerary];
        newItinerary[index] = updatedItem;
        setItinerary(newItinerary);
    };

    const addItineraryItem = (type) => {
        setItinerary([...itinerary, { type, description: '', date: '', time: '' }]);
    };

    const removeItineraryItem = (index) => {
        const newItinerary = itinerary.filter((_, i) => i !== index);
        setItinerary(newItinerary);
    };

    const handleSaveClick = async () => {
        setIsSaving(true);
        const success = await onSave({ ...formData, itinerary });
        setIsSaving(false);
        if (success) {
            onClose(); // Only close if save was successful
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-4xl flex flex-col h-[90vh]">
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <h2 className="text-2xl font-bold text-gray-800">Dynamic Transport Voucher</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-800"><XIcon className="h-6 w-6"/></button>
                </div>

                <div className="grid md:grid-cols-2 gap-8 overflow-y-auto flex-grow pr-2">
                    {/* Left Column for Main Details */}
                    <div className="space-y-4 text-sm">
                        {Object.keys(formData).map(key => (
                             <div key={key}>
                                <label className="block font-medium text-gray-700 capitalize">{key.replace(/([A-Z])/g, ' $1')}</label>
                                <input
                                    type={key.includes('Date') ? 'date' : key.includes('Time') ? 'time' : 'text'}
                                    name={key}
                                    value={formData[key]}
                                    onChange={handleFormChange}
                                    className="mt-1 w-full border border-gray-300 rounded-lg p-2 focus:ring-red-800 focus:border-red-800"
                                />
                            </div>
                        ))}
                    </div>

                    {/* Right Column for Dynamic Itinerary */}
                    <div className="bg-gray-50 p-4 rounded-lg flex flex-col">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Itinerary Builder</h3>
                        <div className="space-y-3 flex-grow overflow-y-auto pr-2">
                            {itinerary.map((item, index) => (
                                <ItineraryItem key={index} index={index} item={item} onUpdate={handleItineraryChange} onRemove={removeItineraryItem} />
                            ))}
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t">
                            <button onClick={() => addItineraryItem('Ziyara\'at / Tour')} className="w-full bg-blue-100 text-blue-800 text-sm font-semibold p-2 rounded-lg hover:bg-blue-200">Add Ziyara'at</button>
                            <button onClick={() => addItineraryItem('Hotel Transfer')} className="w-full bg-green-100 text-green-800 text-sm font-semibold p-2 rounded-lg hover:bg-green-200">Add Hotel Transfer</button>
                            <button onClick={() => addItineraryItem('Return Transfer')} className="w-full bg-gray-200 text-gray-800 text-sm font-semibold p-2 rounded-lg hover:bg-gray-300 col-span-2">Add Return to Airport</button>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-4 mt-6 flex-shrink-0">
                    <button onClick={onClose} className="bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-lg hover:bg-gray-300">Cancel</button>
                    <button onClick={handleSaveClick} disabled={isSaving} className="bg-red-800 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-red-700 disabled:bg-red-300 w-48">
                        {isSaving ? 'Saving...' : 'Generate & Save Voucher'}
                    </button>
                </div>
            </div>
        </div>
    );
}
