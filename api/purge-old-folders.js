import { S3Client, DeleteObjectsCommand } from "@aws-sdk/client-s3";
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize services (same as delete-customer-folder)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
}
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
  // Add a simple secret key to prevent unauthorized runs
  if (req.headers['authorization'] !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const customersRef = db.collection('customers');
    const q = customersRef.where('createdAt', '<', twelveMonthsAgo);
    
    const querySnapshot = await q.get();

    if (querySnapshot.empty) {
      return res.status(200).json({ message: 'No old folders to delete.' });
    }

    let deletedCount = 0;
    const batch = db.batch();

    for (const doc of querySnapshot.docs) {
        const customerData = doc.data();
        const documents = customerData.documents || [];

        if (documents.length > 0) {
            const objectsToDelete = documents.map(d => ({ Key: d.fileKey })).filter(obj => obj.Key);
            if(objectsToDelete.length > 0) {
                const deleteCommand = new DeleteObjectsCommand({
                    Bucket: process.env.R2_BUCKET_NAME,
                    Delete: { Objects: objectsToDelete },
                });
                await s3.send(deleteCommand);
            }
        }
        batch.delete(doc.ref);
        deletedCount++;
    }

    await batch.commit();

    res.status(200).json({ success: true, message: `${deletedCount} old folder(s) deleted successfully.` });

  } catch (error) {
    console.error('Error purging old folders:', error);
    res.status(500).json({ error: 'An internal server error occurred during purge.' });
  }
}
