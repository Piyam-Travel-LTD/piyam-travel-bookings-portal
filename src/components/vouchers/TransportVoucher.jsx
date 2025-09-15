import React from 'react';
import { piyamTravelLogoBase64 } from '../../data';

// This component is only for rendering the HTML structure of the voucher.
export const TransportVoucher = ({ customer, voucherData }) => {
  return (
    <div style={{ width: '800px', fontFamily: 'sans-serif', border: '1px solid #ccc', padding: '20px', backgroundColor: 'white' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '10px', borderBottom: '2px solid #800000' }}>
        <img src={piyamTravelLogoBase64} alt="Logo" style={{ width: '160px', height: 'auto' }} />
        <h1 style={{ color: '#800000', margin: 0, fontSize: '28px' }}>Transport Voucher</h1>
      </div>
      <div style={{ marginTop: '20px', fontSize: '14px' }}>
        <p><strong>Passenger:</strong> {customer.firstName} {customer.lastName}</p>
        <p><strong>Details:</strong> {voucherData.passengers}</p>
        <p><strong>Reference:</strong> {customer.referenceNumber}</p>
      </div>
      <h2 style={{ color: '#800000', borderBottom: '1px solid #eee', paddingBottom: '5px', marginTop: '20px' }}>Arrival Details</h2>
      <table style={{ width: '100%', fontSize: '14px' }}>
        <tbody>
          <tr><td style={{ fontWeight: 'bold', width: '150px' }}>Flight:</td><td>{voucherData.flightNumber} ({voucherData.airports})</td></tr>
          <tr><td style={{ fontWeight: 'bold' }}>Landing:</td><td>{voucherData.landingDate} at {voucherData.landingTime}</td></tr>
        </tbody>
      </table>
      <h2 style={{ color: '#800000', borderBottom: '1px solid #eee', paddingBottom: '5px', marginTop: '20px' }}>Transfer Details</h2>
      <table style={{ width: '100%', fontSize: '14px' }}>
        <tbody>
          <tr><td style={{ fontWeight: 'bold', width: '150px' }}>Pickup Location:</td><td>{voucherData.pickupLocation}</td></tr>
          <tr><td style={{ fontWeight: 'bold' }}>Dropoff Location:</td><td>{voucherData.dropoffLocation}</td></tr>
          <tr><td style={{ fontWeight: 'bold' }}>Pickup Time:</td><td>{voucherData.pickupDate} at {voucherData.pickupTime}</td></tr>
          <tr><td style={{ fontWeight: 'bold' }}>Baggage Allowance:</td><td>{voucherData.maxBags} Bags ({voucherData.extraBaggageFee} for extras)</td></tr>
        </tbody>
      </table>
        <h2 style={{ color: '#800000', borderBottom: '1px solid #eee', paddingBottom: '5px', marginTop: '20px' }}>Provider Details</h2>
      <table style={{ width: '100%', fontSize: '14px' }}>
        <tbody>
          <tr><td style={{ fontWeight: 'bold', width: '150px' }}>Company:</td><td>{voucherData.providerName}</td></tr>
          <tr><td style={{ fontWeight: 'bold' }}>Contact:</td><td>{voucherData.providerContact}</td></tr>
        </tbody>
      </table>
    </div>
  );
};
