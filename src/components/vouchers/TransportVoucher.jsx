import React from 'react';
import QRCode from 'qrcode.react';
import { piyamTravelLogoBase64 } from '../../data';

// Helper to format time in the new "24HR AM/PM" format
const formatTimeOnly = (date, time) => {
    if (!date || !time) return 'N/A';
    const dateTime = new Date(`${date}T${time}`);
    
    // Get the 24-hour part (e.g., "14:00")
    const time24hr = dateTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });

    // Get the AM/PM part (e.g., "PM")
    const ampm = dateTime.toLocaleTimeString('en-US', { hour12: true, hour: 'numeric' }).slice(-2);

    return `${time24hr} ${ampm}`;
};


// Helper to format the full date and time string
const formatDateTime = (dateStr, timeStr) => {
    if (!dateStr || !timeStr) return 'N/A';
    const date = new Date(`${dateStr}T${timeStr}`);
    const formattedDate = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const formattedTime = formatTimeOnly(dateStr, timeStr); // Use the new time formatter
    return `${formattedDate} @ ${formattedTime}`;
};

export const TransportVoucher = ({ customer, voucherData }) => {
    // Generate QR text from the full itinerary
    const itineraryForQR = voucherData.itinerary.map((item, index) => 
        `${index + 1}. ${item.type}: ${item.description} at ${formatDateTime(item.date, item.time)}`
    ).join('\n');
  
    const qrText = `GROUND TRANSPORT\nREF: ${customer.referenceNumber}\nPASSENGER: ${customer.firstName} ${customer.lastName}\n\n${itineraryForQR}`;
  
    return (
        <div style={{ width: '900px', fontFamily: "'Inter', sans-serif", backgroundColor: 'white', display: 'flex', borderRadius: '16px', border: '1px solid #e5e7eb' }}>
            {/* Main Section */}
            <div style={{ flexGrow: 1, padding: '24px', display: 'flex', flexDirection: 'column', fontSize: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: '12px', borderBottom: '1px solid #e5e7eb' }}>
                    <img src={piyamTravelLogoBase64} alt="Piyam Travel Logo" style={{ width: '160px', height: 'auto', objectFit: 'contain' }} />
                    <div style={{ textAlign: 'right' }}>
                        <h2 style={{ fontSize: '28px', fontWeight: 'bold', color: '#800000', margin: 0 }}>GROUND TRANSPORT</h2>
                        <p style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', letterSpacing: '0.05em', margin: 0 }}>VOUCHER / ITINERARY</p>
                    </div>
                </div>
        
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px', marginTop: '20px', flexGrow: 1 }}>
                    <div>
                        <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>LEAD PASSENGER</p>
                        <p style={{ fontWeight: '600', color: '#111827', fontSize: '18px', margin: 0 }}>{customer.firstName} {customer.lastName}</p>
                    </div>
                    <div>{/* Empty cell for alignment */}</div>
                    <div>
                        <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>PASSENGERS</p>
                        <p style={{ fontWeight: '600', color: '#1f2937', margin: 0 }}>{voucherData.passengers}</p>
                    </div>
                    <div>
                        <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>FLIGHT</p>
                        <p style={{ fontWeight: '600', color: '#1f2937', margin: 0 }}>{voucherData.flightNumber}</p>
                    </div>
                    <div>
                        <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>ARRIVAL FROM</p>
                        <p style={{ fontWeight: '600', color: '#1f2937', margin: 0 }}>{voucherData.airports}</p>
                    </div>
                     <div>
                        <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>LANDING</p>
                        <p style={{ fontWeight: '600', color: '#1f2937', margin: 0 }}>{formatDateTime(voucherData.landingDate, voucherData.landingTime)}</p>
                    </div>
                    <div style={{ gridColumn: 'span 2', borderTop: '1px solid #e5e7eb', paddingTop: '12px' }}>
                        <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>ITINERARY</p>
                        <div style={{ fontSize: '13px', marginTop: '4px', color: '#374151', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {voucherData.itinerary.map((item, index) => (
                                <div key={index}>
                                    <strong>{index + 1}. {item.type}:</strong> {item.description} at {formatTimeOnly(item.date, item.time)}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '12px', marginTop: 'auto', fontSize: '12px', display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                        <p style={{ fontWeight: 'bold', margin: 0 }}>Transport Provider: {voucherData.providerName}</p>
                        <p style={{ margin: 0 }}>Transport Manager contact: {voucherData.providerContact}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <p style={{ fontWeight: 'bold', margin: 0 }}>Voucher Agency: Piyam Travel</p>
                        <p style={{ margin: 0 }}>Email: info@piyamtravel.com | 24/7: +447400828212</p>
                    </div>
                </div>
            </div>
      
            {/* Stub Section */}
            <div style={{ backgroundColor: '#800000', color: 'white', padding: '24px', width: '256px', flexShrink: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRadius: '0 16px 16px 0' }}>
                <div>
                    <div style={{ textAlign: 'center', paddingBottom: '12px', borderBottom: '1px solid #a83333' }}><h3 style={{ fontWeight: 'bold', letterSpacing: '0.05em', margin: 0 }}>Piyam Travel</h3><p style={{ fontSize: '12px', opacity: 0.8, margin: 0 }}>CUSTOMER COPY</p></div>
                    <div style={{ marginTop: '16px', fontSize: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div><p style={{ fontSize: '12px', color: '#fecaca', margin: 0 }}>PASSENGER</p><p style={{ fontWeight: '600', margin: 0 }}>{customer.firstName} {customer.lastName}</p></div>
                        <div><p style={{ fontSize: '12px', color: '#fecaca', margin: 0 }}>REFERENCE</p><p style={{ fontWeight: '600', margin: 0 }}>{customer.referenceNumber}</p></div>
                        <div><p style={{ fontSize: '12px', color: '#fecaca', margin: 0 }}>BOOKING ID</p><p style={{ fontWeight: '600', margin: 0 }}>{voucherData.bookingId || 'N/A'}</p></div>
                        <div><p style={{ fontSize: '12px', color: '#fecaca', margin: 0 }}>VEHICLE</p><p style={{ fontWeight: '600', margin: 0 }}>GMC / Hyundai Staria</p></div>
                        <div><p style={{ fontSize: '12px', color: '#fecaca', margin: 0 }}>BAGGAGE</p><p style={{ fontWeight: '600', fontSize: '12px', margin: 0 }}>{voucherData.maxBags} Bags Max ({voucherData.extraBaggageFee})</p></div>
                    </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '16px' }}>
                    <div style={{ backgroundColor: 'white', padding: '6px', borderRadius: '6px' }}><QRCode value={qrText.trim()} size={110} level="H" /></div>
                </div>
            </div>
        </div>
    );
};
