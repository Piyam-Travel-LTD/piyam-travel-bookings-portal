import React from 'react';
import QRCode from 'qrcode.react';
import { piyamTravelLogoBase64, clientPortalUrl } from '../../data';
import { XIcon, LinkIcon, CopyIcon } from '../Icons';

export default function VoucherModal({ isOpen, onClose, customer, handleCopy, copySuccess }) {
    if (!isOpen || !customer) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-3xl relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-800"><XIcon className="h-6 w-6"/></button>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Share Customer Access</h2>
                <p className="text-gray-500 mb-6">Share these details with your customer to access their portal.</p>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 flex items-center gap-6">
                    <div className="w-1/4 flex-shrink-0 flex items-center justify-center"><img src={piyamTravelLogoBase64} alt="Piyam Travel Logo" className="w-32 h-auto object-contain"/></div>
                    <div className="flex-grow text-center border-l border-r border-gray-200 px-6">
                        <p className="text-sm text-gray-500">Customer</p>
                        <p className="text-xl font-bold text-gray-900">{customer.firstName} {customer.lastName}</p>
                        <p className="text-sm text-gray-500 mt-4">Reference Number</p>
                        <p className="text-xl font-mono text-red-800 bg-red-50 border border-red-200 rounded-md px-2 py-1 inline-block">{customer.referenceNumber}</p>
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
                    <button onClick={() => handleCopy( `Dear ${customer.firstName} ${customer.lastName},\n\nYour travel documents are now available...`, 'Details Copied!')} className="flex items-center justify-center w-full bg-red-800 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-red-700 transition-colors"><CopyIcon className="h-5 w-5 mr-2" />Copy Details as Text</button>
                </div>
                {copySuccess && <p className="text-center text-green-600 font-semibold mt-4">{copySuccess}</p>}
            </div>
        </div>
    );
}
