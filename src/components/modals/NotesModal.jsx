import React from 'react';

export default function NotesModal({ isOpen, onClose, customer, newNote, setNewNote, handleAddNote }) {
    if (!isOpen || !customer) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg flex flex-col h-[70vh]">
                <div className="flex-shrink-0">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Internal Notes</h2>
                    <p className="text-gray-500 mb-4">For agent use only. Notes are saved automatically.</p>
                </div>
                <div className="flex-grow bg-gray-50 rounded-lg p-4 overflow-y-auto mb-4">
                    {(customer.notes || []).length > 0 ? (
                        (customer.notes || []).map(note => (
                            <div key={note.timestamp} className="mb-4">
                                <p className="text-xs text-gray-400">{new Date(note.timestamp).toLocaleString()}</p>
                                <p className="text-gray-700 bg-white p-3 rounded-lg">{note.text}</p>
                            </div>
                        ))
                    ) : (<p className="text-center text-gray-500 italic">No notes yet.</p>)}
                </div>
                <div className="flex-shrink-0 flex gap-4">
                    <input type="text" value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="Type a new note..." className="flex-grow w-full border border-gray-300 rounded-lg p-2 focus:ring-red-800 focus:border-red-800" />
                    <button onClick={handleAddNote} className="bg-red-800 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-red-700 transition-colors">Add Note</button>
                </div>
                <button onClick={onClose} className="w-full mt-4 bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors">Close</button>
            </div>
        </div>
    );
}
