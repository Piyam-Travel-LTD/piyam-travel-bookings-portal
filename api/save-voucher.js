import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

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

  const { htmlContent, customerId } = req.body;
  if (!htmlContent || !customerId) {
    return res.status(400).json({ error: 'HTML content and customer ID are required.' });
  }
  
  const fileName = `Transport-Voucher-${Date.now()}.html`;
  const fileKey = `${customerId}/${fileName}`;

  try {
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: fileKey,
      Body: htmlContent,
      ContentType: 'text/html',
    });

    await s3.send(command);
    
    const publicUrl = `${process.env.R2_PUBLIC_URL}/${fileKey}`;

    res.status(200).json({ 
      success: true,
      publicUrl: publicUrl,
      fileKey: fileKey,
      fileName: fileName
    });

  } catch (error) {
    console.error('Error saving voucher:', error);
    res.status(500).json({ error: 'Could not save voucher.' });
  }
}
