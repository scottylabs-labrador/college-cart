import { S3Client, PutBucketCorsCommand } from "@aws-sdk/client-s3";
import * as dotenv from "dotenv";
import { join } from "path";

dotenv.config({ path: join(process.cwd(), ".env.local") });

const bucketName = process.env.TIGRIS_BUCKET_NAME;
const endpoint = process.env.TIGRIS_ENDPOINT;
const accessKeyId = process.env.TIGRIS_ACCESS_KEY_ID;
const secretAccessKey = process.env.TIGRIS_SECRET_ACCESS_KEY;

if (!bucketName || !endpoint || !accessKeyId || !secretAccessKey) {
  console.error("Missing required TIGRIS env vars in .env.local");
  process.exit(1);
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

async function setBucketCors() {
  try {
    await s3Client.send(
      new PutBucketCorsCommand({
        Bucket: bucketName,
        CORSConfiguration: {
          CORSRules: [
            {
              AllowedOrigins: [
                "https://collegecart.org",
                "https://www.collegecart.org",
                "http://localhost:3000",
              ],
              AllowedMethods: ["GET", "PUT", "POST", "HEAD"],
              AllowedHeaders: ["*"],
              ExposeHeaders: ["ETag"],
              MaxAgeSeconds: 3600,
            },
          ],
        },
      })
    );
    console.log(`Successfully set CORS policy on bucket "${bucketName}".`);
  } catch (err) {
    console.error("Failed to set CORS policy:", err);
    process.exit(1);
  }
}

setBucketCors();
