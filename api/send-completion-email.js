import formData from 'form-data';
import Mailgun from 'mailgun.js';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
// Import from the new, local library file
import { CompletionEmail } from './_lib/emailTemplates.js';

const mailgun = new Mailgun(formData);

// Initialize the Mailgun client with the EU endpoint
const mg = mailgun.client({
  username: 'api',
  key: process.env.MAILGUN_API_KEY,
  url: 'https://api.eu.mailgun.net', // This is the required line for EU domains
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { customer } = req.body;
  if (!customer || !customer.keyInformation?.customerEmail) {
    return res.status(400).json({ error: 'Customer data and email are required.' });
  }

  const emailHtml = ReactDOMServer.renderToString(<CompletionEmail customer={customer} />);

  const messageData = {
    from: process.env.MAILGUN_SENDER_EMAIL,
    to: customer.keyInformation.customerEmail,
    subject: `Your Travel Documents for ${customer.destination} are Complete!`,
    html: emailHtml,
  };

  try {
    // Use your Mailgun domain from the environment variables
    await mg.messages.create(process.env.MAILGUN_DOMAIN, messageData);
    res.status(200).json({ success: true, message: 'Completion email sent successfully.' });
  } catch (error) {
    // Log the detailed error from Mailgun for better debugging
    console.error('Error sending email via Mailgun:', error);
    res.status(500).json({ error: 'Could not send completion email.' });
  }
}
