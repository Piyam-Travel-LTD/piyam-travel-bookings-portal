import formData from 'form-data';
import Mailgun from 'mailgun.js';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { CompletionEmail } from '../../src/components/emails/CompletionEmail';

const mailgun = new Mailgun(formData);
const mg = mailgun.client({
  username: 'api',
  key: process.env.MAILGUN_API_KEY,
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
    await mg.messages.create(process.env.MAILGUN_DOMAIN, messageData);
    res.status(200).json({ success: true, message: 'Completion email sent successfully.' });
  } catch (error) {
    console.error('Error sending email via Mailgun:', error);
    res.status(500).json({ error: 'Could not send completion email.' });
  }
}
