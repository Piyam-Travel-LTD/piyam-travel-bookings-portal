import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";

// Create an S3 client configured for Cloudflare R2
const s3 = new S3Client({
  region: "auto",
  endpoint: `https://a09d97a55041952a5759c9577d9b873b.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { fileKey } = req.body;
  if (!fileKey) {
    return res.status(400).json({ error: 'File key is required.' });
  }

  try {
    const command = new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: fileKey, // e.g., "customer-id/timestamp-filename.pdf"
    });

    await s3.send(command);

    res.status(200).json({ success: true, message: 'File deleted successfully.' });

  } catch (error) {
    console.error('Error deleting file from R2:', error);
    res.status(500).json({ error: 'Could not delete file.' });
  }
}
