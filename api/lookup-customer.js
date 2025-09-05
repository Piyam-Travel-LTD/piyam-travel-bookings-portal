import admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { referenceNumber, lastName } = req.body;

  if (!referenceNumber || !lastName) {
    return res.status(400).json({ error: 'Reference number and last name are required.' });
  }

  try {
    const customersRef = db.collection('customers');
    // --- UPDATED QUERY LOGIC ---
    const q = customersRef
      .where('referenceNumber', '==', `PT-${referenceNumber.trim().toUpperCase()}`)
      .where('lastName_lowercase', '==', lastName.trim().toLowerCase()); // Search the lowercase field
      
    const querySnapshot = await q.get();

    if (querySnapshot.empty) {
      return res.status(404).json({ error: 'Invalid reference number or last name. Please try again.' });
    }

    const customerData = querySnapshot.docs[0].data();
    return res.status(200).json(customerData);

  } catch (error) {
    console.error('API Lookup Error:', error);
    return res.status(500).json({ error: 'An internal server error occurred.' });
  }
}
