import { S3Client, DeleteObjectsCommand } from "@aws-sdk/client-s3";
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
}

// Initialize S3 Client for R2
const s3 = new S3Client({
  region: "auto",
  endpoint: `https://a09d97a55041952a5759c9577d9b873b.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const db = getFirestore();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { customerId } = req.body;
  if (!customerId) {
    return res.status(400).json({ error: 'Customer ID is required.' });
  }

  const customerDocRef = db.collection('customers').doc(customerId);

  try {
    const customerDoc = await customerDocRef.get();
    if (!customerDoc.exists) {
      return res.status(404).json({ error: 'Customer not found.' });
    }
    const customerData = customerDoc.data();
    const documents = customerData.documents || [];

    if (documents.length > 0) {
      const objectsToDelete = documents.map(doc => ({ Key: doc.fileKey })).filter(obj => obj.Key);
      
      if (objectsToDelete.length > 0) {
        const deleteCommand = new DeleteObjectsCommand({
          Bucket: process.env.R2_BUCKET_NAME,
          Delete: { Objects: objectsToDelete, Quiet: false },
        });
        await s3.send(deleteCommand);
      }
    }

    await customerDocRef.delete();
    res.status(200).json({ success: true, message: 'Customer folder deleted.' });

  } catch (error) {
    console.error('Error deleting customer folder:', error);
    res.status(500).json({ error: 'Could not delete customer folder.' });
  }
}
