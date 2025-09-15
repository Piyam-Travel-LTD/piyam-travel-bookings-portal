import React from 'react';

export default function ExtendAccessModal({ isOpen, onClose, handleExtendAccess }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Extend Customer Access</h2>
                <p className="text-gray-600 mb-6">Select a new access duration. The expiry will be calculated from today.</p>
                <div className="flex flex-col gap-4">
                    <button onClick={() => handleExtendAccess(1)} className="w-full bg-blue-100 text-blue-800 font-semibold py-2 px-4 rounded-lg hover:bg-blue-200 transition-colors">Extend for 1 Month</button>
                    <button onClick={() => handleExtendAccess(3)} className="w-full bg-blue-100 text-blue-800 font-semibold py-2 px-4 rounded-lg hover:bg-blue-200 transition-colors">Extend for 3 Months</button>
                    <button onClick={() => handleExtendAccess(6)} className="w-full bg-blue-100 text-blue-800 font-semibold py-2 px-4 rounded-lg hover:bg-blue-200 transition-colors">Extend for 6 Months</button>
                </div>
                <div className="flex justify-end mt-6">
                     <button onClick={onClose} className="bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors">Cancel</button>
                </div>
            </div>
        </div>
    );
}
