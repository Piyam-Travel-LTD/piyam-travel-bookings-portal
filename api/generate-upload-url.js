import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

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

  const { fileName, customerId } = req.body;
  if (!fileName || !customerId) {
    return res.status(400).json({ error: 'Filename and customer ID are required.' });
  }
  
  // Sanitize filename to prevent issues
  const safeFileName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, '');
  const fileKey = `${customerId}/${Date.now()}-${safeFileName}`;

  try {
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: fileKey,
    });

    // Generate a secure, one-time URL for uploading
    const signedUrl = await getSignedUrl(s3, command, { expiresIn: 300 }); // URL is valid for 5 minutes

    res.status(200).json({ 
      uploadUrl: signedUrl, 
      publicUrl: `${process.env.R2_PUBLIC_URL}/${fileKey}` 
    });

  } catch (error) {
    console.error('Error generating signed URL:', error);
    res.status(500).json({ error: 'Could not generate upload URL.' });
  }
}
