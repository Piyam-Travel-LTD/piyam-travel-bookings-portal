import formData from 'form-data';
import Mailgun from 'mailgun.js';

// --- Email HTML Template ---
const createEmailHtml = (customer) => {
  // IMPORTANT: For the logo to display reliably in all email clients,
  // it should be hosted publicly. Replace this URL with the actual URL of your logo.
  const logoUrl = 'https://pub-cf96e4b7c0424b8b9b1040a20acf06d3.r2.dev/Logo.png'; // Example URL
  const clientPortalUrl = "https://bookings.piyamtravel.com";

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f9fafb; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px; }
        .header { text-align: center; padding-bottom: 20px; border-bottom: 1px solid #e5e7eb; }
        .content { padding: 20px; line-height: 1.6; color: #374151; }
        .footer { text-align: center; font-size: 12px; color: #9ca3af; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
        .button { display: inline-block; padding: 12px 24px; margin: 20px 0; background-color: #991b1b; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: bold; }
        .details { background-color: #f9fafb; padding: 16px; border-radius: 8px; border: 1px solid #e5e7eb; margin-top: 20px; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="${logoUrl}" alt="Piyam Travel Logo" style="width: 160px; height: auto;" />
        </div>
        <div class="content">
          <h1 style="color: #111827; font-size: 24px;">Dear ${customer.firstName} ${customer.lastName},</h1>
          <p>We are pleased to inform you that your travel package has been finalised and all your documents are now complete.</p>
          <p>You can view and download all your travel documents at any time from your secure client portal. Please use the details below to log in:</p>
          <div class="details">
            <p><strong>Website:</strong> ${clientPortalUrl}</p>
            <p><strong>Reference Number:</strong> <span style="font-weight: bold; color: #991b1b;">${customer.referenceNumber}</span></p>
            <p><strong>Last Name:</strong> <span style="font-weight: bold;">${customer.lastName}</span></p>
            <a href="${clientPortalUrl}" class="button" style="color: #ffffff !important; text-decoration: none;">Access Your Portal</a>
          </div>
          <p>We wish you a safe and pleasant journey.</p>
          <p>Kind regards,<br />The Piyam Travel Team</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Piyam Travel Ltd. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// --- API Logic ---
const mailgun = new Mailgun(formData);
const mg = mailgun.client({
  username: 'api',
  key: process.env.MAILGUN_API_KEY,
  url: 'https://api.eu.mailgun.net',
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { customer } = req.body;
  if (!customer || !customer.keyInformation?.customerEmail) {
    return res.status(400).json({ error: 'Customer data and email are required.' });
  }

  const emailHtml = createEmailHtml(customer);

  // Updated dynamic subject line
  const subject = `${customer.referenceNumber}: Your Package Documents for ${customer.packageType} in ${customer.destination} are Complete!`;

  const messageData = {
    from: process.env.MAILGUN_SENDER_EMAIL,
    to: customer.keyInformation.customerEmail,
    subject: subject,
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
