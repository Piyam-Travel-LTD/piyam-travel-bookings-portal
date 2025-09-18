import React from 'react';
import { piyamTravelLogoBase64, clientPortalUrl } from '../../data';

export const CompletionEmail = ({ customer }) => {
  const containerStyle = {
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    maxWidth: '600px',
    margin: '0 auto',
    backgroundColor: '#f9fafb',
    padding: '20px',
    border: '1px solid #e5e7eb',
    borderRadius: '12px'
  };

  const headerStyle = {
    textAlign: 'center',
    paddingBottom: '20px',
    borderBottom: '1px solid #e5e7eb'
  };

  const contentStyle = {
    padding: '20px',
    lineHeight: '1.6',
    color: '#374151'
  };

  const footerStyle = {
    textAlign: 'center',
    fontSize: '12px',
    color: '#9ca3af',
    marginTop: '20px',
    paddingTop: '20px',
    borderTop: '1px solid #e5e7eb'
  };

  const buttonStyle = {
    display: 'inline-block',
    padding: '12px 24px',
    margin: '20px 0',
    backgroundColor: '#991b1b',
    color: '#ffffff',
    textDecoration: 'none',
    borderRadius: '8px',
    fontWeight: 'bold'
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <img src={piyamTravelLogoBase64} alt="Piyam Travel Logo" style={{ width: '160px', height: 'auto' }} />
      </div>
      <div style={contentStyle}>
        <h1 style={{ color: '#111827', fontSize: '24px' }}>Dear {customer.firstName} {customer.lastName},</h1>
        <p>We are pleased to inform you that your travel package has been finalized and all your documents are now complete.</p>
        <p>You can view and download all your travel documents at any time from your secure client portal. Please use the details below to log in:</p>
        <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid #e5e7eb', marginTop: '20px', textAlign: 'center' }}>
          <p><strong>Website:</strong> {clientPortalUrl}</p>
          <p><strong>Reference Number:</strong> <span style={{ fontWeight: 'bold', color: '#991b1b' }}>{customer.referenceNumber}</span></p>
          <p><strong>Last Name:</strong> <span style={{ fontWeight: 'bold' }}>{customer.lastName}</span></p>
          <a href={clientPortalUrl} style={buttonStyle}>Access Your Portal</a>
        </div>
        <p>We wish you a safe and pleasant journey.</p>
        <p>Kind regards,<br />The Piyam Travel Team</p>
      </div>
      <div style={footerStyle}>
        <p>&copy; {new Date().getFullYear()} Piyam Travel Ltd. All rights reserved.</p>
      </div>
    </div>
  );
};
