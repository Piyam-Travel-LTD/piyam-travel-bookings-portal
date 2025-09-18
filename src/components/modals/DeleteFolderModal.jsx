import React from 'react';

export default function DeleteFolderModal({ isOpen, onClose, deleteConfirmText, setDeleteConfirmText, handleDeleteFolder }) {
    if (!isOpen) return null;
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
                <h2 className="text-2xl font-bold text-red-800 mb-2">Delete Customer Folder</h2>
                <p className="text-gray-600 mb-4">This action is permanent and cannot be undone. All associated documents will be deleted from storage.</p>
                <p className="text-sm text-gray-700">To confirm, please type <strong>Delete</strong> in the box below.</p>
                <input 
                    type="text" 
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    className="mt-2 w-full border border-gray-300 rounded-lg p-2 focus:ring-red-800 focus:border-red-800" 
                />
                <div className="flex justify-end gap-4 mt-6">
                    <button onClick={onClose} className="bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors">Cancel</button>
                    <button 
                        onClick={handleDeleteFolder} 
                        disabled={deleteConfirmText !== 'Delete'}
                        className="bg-red-800 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-red-700 transition-colors disabled:bg-red-300 disabled:cursor-not-allowed">
                        Permanently Delete
                    </button>
                </div>
            </div>
        </div>
    );
}
