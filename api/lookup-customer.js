// This is our secure "Digital Bouncer" - a Vercel Serverless Function.
// It runs on the server, not in the user's browser.

// We need to import the Firebase Admin SDK to give this function special access
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize the Firebase Admin App
// Vercel Environment Variables will securely provide the credentials
try {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      })
    });
  }
} catch (error) {
  console.error('Firebase admin initialization error', error.stack);
}

const db = getFirestore();

export default async function handler(req, res) {
  // We only allow POST requests for security
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { referenceNumber, lastName } = req.body;

  if (!referenceNumber || !lastName) {
    return res.status(400).json({ error: 'Reference number and last name are required.' });
  }

  try {
    const customersRef = db.collection('customers');
    const q = customersRef
      .where('referenceNumber', '==', referenceNumber.trim().toUpperCase())
      .where('lastName', '==', lastName.trim());
      
    const querySnapshot = await q.get();

    if (querySnapshot.empty) {
      return res.status(404).json({ error: 'Customer not found.' });
    }

    // Return the data for the single customer that was found
    const customerData = querySnapshot.docs[0].data();
    return res.status(200).json(customerData);

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'An internal server error occurred.' });
  }
}
