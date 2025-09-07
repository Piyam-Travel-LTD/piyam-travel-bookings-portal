import admin from 'firebase-admin';

// This securely initializes the Firebase Admin SDK using the credentials
// you stored in Vercel's Environment Variables.
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
    const q = customersRef
      .where('referenceNumber', '==', `PT-${referenceNumber.trim().toUpperCase()}`)
      .where('lastName_lowercase', '==', lastName.trim().toLowerCase());
      
    const querySnapshot = await q.get();

    if (querySnapshot.empty) {
      return res.status(404).json({ error: 'Invalid reference number or last name. Please try again.' });
    }

    const doc = querySnapshot.docs[0];
    const customerData = doc.data();

    // --- THIS IS THE CRUCIAL FIX ---
    // We manually translate the Firestore Timestamps into a universal format (ISO string)
    // before sending the data to the client.
    const finalData = {
      ...customerData,
      id: doc.id,
      createdAt: customerData.createdAt ? customerData.createdAt.toDate().toISOString() : null,
      lastUpdatedAt: customerData.lastUpdatedAt ? customerData.lastUpdatedAt.toDate().toISOString() : null,
    };
    
    return res.status(200).json(finalData);

  } catch (error) {
    console.error('API Lookup Error:', error);
    return res.status(500).json({ error: 'An internal server error occurred.' });
  }
}
