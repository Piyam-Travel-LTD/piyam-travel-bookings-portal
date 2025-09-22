import React, { useState } from 'react';
import { XIcon } from '../Icons';
import { TransportVoucher } from '../vouchers/TransportVoucher';

// A single, reusable component for an itinerary item
const ItineraryItem = ({ item, index, onUpdate, onRemove }) => {
    const handleChange = (e) => {
        onUpdate(index, { ...item, [e.target.name]: e.target.value });
    };

    return (
        <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg border border-gray-200 dark:border-gray-600 space-y-2">
            <div className="flex justify-between items-center">
                <p className="font-semibold text-gray-700 dark:text-gray-300">Segment #{index + 1}: {item.type}</p>
                <button type="button" onClick={() => onRemove(index)} className="text-red-500 hover:text-red-700 text-sm font-bold">Remove</button>
            </div>
            <input type="text" name="description" value={item.description} onChange={handleChange} placeholder="e.g., Makkah Hotel to Madinah Hotel" className="w-full border-gray-300 dark:border-gray-500 rounded-md shadow-sm text-sm dark:bg-gray-800" />
            <div className="grid grid-cols-2 gap-2">
                <input type="date" name="date" value={item.date} onChange={handleChange} className="w-full border-gray-300 dark:border-gray-500 rounded-md shadow-sm text-sm dark:bg-gray-800" />
                <input type="time" name="time" value={item.time} onChange={handleChange} className="w-full border-gray-300 dark:border-gray-500 rounded-md shadow-sm text-sm dark:bg-gray-800" />
            </div>
        </div>
    );
};

// --- Vehicle Options ---
const vehicleTypes = [
    { name: 'Car', passengers: 4, bags: 3 },
    { name: 'H1', passengers: 6, bags: 6 },
    { name: 'Hiace', passengers: 13, bags: 13 },
    { name: 'Coaster', passengers: 18, bags: 18 },
    { name: 'Coach', passengers: 52, bags: 52 },
];

export default function TransportVoucherModal({ isOpen, onClose, customer, onSave }) {
    const defaultVehicle = vehicleTypes[1]; // Default to H1

    const [formData, setFormData] = useState({
        bookingId: '',
        passengers: `${defaultVehicle.passengers} Adults, 0 Children`,
        flightNumber: 'EK007',
        airports: 'LHR to JED',
        landingDate: new Date().toISOString().split('T')[0],
        landingTime: '22:30',
        vehicle: defaultVehicle.name,
        maxBags: defaultVehicle.bags.toString(),
        extraBaggageFee: '50 SAR per bag',
        providerName: 'Barakat AlMusafar Trading',
        providerContact: '+966555049005',
    });
    
    const [itinerary, setItinerary] = useState([
        { type: 'Airport Pickup', description: 'JED Airport to Makkah Hotel', date: new Date().toISOString().split('T')[0], time: '23:30' }
    ]);
    
    const [overrideBaggage, setOverrideBaggage] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isPreviewing, setIsPreviewing] = useState(false);

    if (!isOpen) return null;

    const handleFormChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleVehicleChange = (e) => {
        const selectedVehicleName = e.target.value;
        const selectedVehicle = vehicleTypes.find(v => v.name === selectedVehicleName);
        if (selectedVehicle) {
            const newFormData = {
                ...formData,
                vehicle: selectedVehicle.name,
                passengers: `${selectedVehicle.passengers} Adults, 0 Children`,
            };
            // Only update baggage if override is NOT active
            if (!overrideBaggage) {
                newFormData.maxBags = selectedVehicle.bags.toString();
            }
            setFormData(newFormData);
        }
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
            onClose(); 
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-4xl flex flex-col h-[90vh]">
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Dynamic Transport Voucher</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"><XIcon className="h-6 w-6"/></button>
                </div>

                {isPreviewing ? (
                    <div className="flex-grow overflow-y-auto flex items-center justify-center p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                       <div className="transform scale-90 origin-top">
                         <TransportVoucher customer={customer} voucherData={{ ...formData, itinerary }} />
                       </div>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 gap-8 overflow-y-auto flex-grow pr-2">
                        <div className="space-y-4 text-sm">
                            <div>
                                <label className="block font-medium text-gray-700 dark:text-gray-300">Vehicle Type</label>
                                <select name="vehicle" value={formData.vehicle} onChange={handleVehicleChange} className="mt-1 w-full border border-gray-300 dark:border-gray-500 rounded-lg p-2 focus:ring-red-800 focus:border-red-800 dark:bg-gray-900">
                                    {vehicleTypes.map(v => <option key={v.name} value={v.name}>{v.name} ({v.passengers} pax, {v.bags} bags)</option>)}
                                </select>
                            </div>

                            {Object.entries(formData).map(([key, value]) => {
                                if (key === 'vehicle' || key === 'maxBags' || key === 'extraBaggageFee') return null;
                                const label = key.replace(/([A-Z])/g, ' $1');
                                return (
                                    <div key={key}>
                                        <label className="block font-medium text-gray-700 dark:text-gray-300 capitalize">{label}</label>
                                        <input
                                            type={key.includes('Date') ? 'date' : key.includes('Time') ? 'time' : 'text'}
                                            name={key}
                                            value={value}
                                            onChange={handleFormChange}
                                            readOnly={key === 'passengers'}
                                            className={`mt-1 w-full border border-gray-300 dark:border-gray-500 rounded-lg p-2 focus:ring-red-800 focus:border-red-800 dark:bg-gray-900 ${key === 'passengers' ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed' : ''}`}
                                        />
                                    </div>
                                );
                            })}
                            
                            {/* --- Baggage Override Section --- */}
                            <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={overrideBaggage} onChange={(e) => setOverrideBaggage(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500" />
                                    <span className="font-medium text-gray-700 dark:text-gray-300">Manually override baggage allowance</span>
                                </label>

                                <div>
                                    <label className="block font-medium text-gray-700 dark:text-gray-300">Max Bags</label>
                                    <input type="text" name="maxBags" value={formData.maxBags} onChange={handleFormChange} readOnly={!overrideBaggage} className={`mt-1 w-full border border-gray-300 dark:border-gray-500 rounded-lg p-2 focus:ring-red-800 focus:border-red-800 dark:bg-gray-900 ${!overrideBaggage ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed' : ''}`} />
                                </div>
                                <div>
                                    <label className="block font-medium text-gray-700 dark:text-gray-300">Extra Baggage Fee</label>
                                    <input type="text" name="extraBaggageFee" value={formData.extraBaggageFee} onChange={handleFormChange} readOnly={!overrideBaggage} className={`mt-1 w-full border border-gray-300 dark:border-gray-500 rounded-lg p-2 focus:ring-red-800 focus:border-red-800 dark:bg-gray-900 ${!overrideBaggage ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed' : ''}`} />
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg flex flex-col">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Itinerary Builder</h3>
                            <div className="space-y-3 flex-grow overflow-y-auto pr-2">
                                {itinerary.map((item, index) => (
                                    <ItineraryItem key={index} index={index} item={item} onUpdate={handleItineraryChange} onRemove={removeItineraryItem} />
                                ))}
                            </div>
                            <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t dark:border-gray-600">
                                <button onClick={() => addItineraryItem('Ziyara\'at / Tour')} className="w-full bg-blue-100 text-blue-800 text-sm font-semibold p-2 rounded-lg hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800">Add Ziyara'at</button>
                                <button onClick={() => addItineraryItem('Hotel Transfer')} className="w-full bg-green-100 text-green-800 text-sm font-semibold p-2 rounded-lg hover:bg-green-200 dark:bg-green-900 dark:text-green-200 dark:hover:bg-green-800">Add Hotel Transfer</button>
                                <button onClick={() => addItineraryItem('Return Transfer')} className="w-full bg-gray-200 text-gray-800 text-sm font-semibold p-2 rounded-lg hover:bg-gray-300 col-span-2 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">Add Return to Airport</button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex justify-end gap-4 mt-6 flex-shrink-0">
                    <button onClick={onClose} className="bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-lg hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">Cancel</button>
                    {isPreviewing ? (
                        <>
                            <button onClick={() => setIsPreviewing(false)} className="bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-lg hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">Back to Edit</button>
                            <button onClick={handleSaveClick} disabled={isSaving} className="bg-red-800 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-red-700 disabled:bg-red-300 w-48">
                                {isSaving ? 'Saving...' : 'Confirm & Save'}
                            </button>
                        </>
                    ) : (
                        <button onClick={() => setIsPreviewing(true)} className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-blue-700 w-48">
                            Preview Voucher
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
