import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const bucketName = process.env.TIGRIS_BUCKET_NAME;
const endpoint = process.env.TIGRIS_ENDPOINT;
const accessKeyId = process.env.TIGRIS_ACCESS_KEY_ID;
const secretAccessKey = process.env.TIGRIS_SECRET_ACCESS_KEY;

if (!bucketName || !endpoint || !accessKeyId || !secretAccessKey) {
  console.warn("Tigris storage is not fully configured. Check your environment variables.");
}

const s3Client = new S3Client({
  region: "auto",
  endpoint,
  forcePathStyle: false,
  credentials: {
    accessKeyId: accessKeyId!,
    secretAccessKey: secretAccessKey!,
  },
});

export async function uploadImage(
  fileBuffer: Buffer | ArrayBuffer,
  fileName: string,
  contentType: string
): Promise<string> {
  const key = `listings/${Date.now()}-${fileName.replace(/\s+/g, "-")}`;
  
  const buffer = fileBuffer instanceof ArrayBuffer ? Buffer.from(fileBuffer) : fileBuffer;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ACL: 'public-read',
    })
  );

  // For Tigris on Fly.io, the public URL pattern is usually:
  // https://<bucket-name>.fly.storage.tigris.dev/<key>
  return `https://${bucketName}.fly.storage.tigris.dev/${key}`;
}

export default s3Client;
