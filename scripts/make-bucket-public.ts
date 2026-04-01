import { S3Client, PutBucketPolicyCommand } from "@aws-sdk/client-s3";
import * as dotenv from "dotenv";
import { join } from "path";

dotenv.config({ path: join(process.cwd(), ".env.local") });

const bucketName = process.env.TIGRIS_BUCKET_NAME;
const endpoint = process.env.TIGRIS_ENDPOINT;
const accessKeyId = process.env.TIGRIS_ACCESS_KEY_ID;
const secretAccessKey = process.env.TIGRIS_SECRET_ACCESS_KEY;

const s3Client = new S3Client({
  region: "auto",
  endpoint,
  forcePathStyle: false,
  credentials: {
    accessKeyId: accessKeyId!,
    secretAccessKey: secretAccessKey!,
  },
});

async function makeBucketPublic() {
  const policy = {
    Version: "2012-10-17",
    Statement: [
      {
        Sid: "PublicRead",
        Effect: "Allow",
        Principal: "*",
        Action: ["s3:GetObject"],
        Resource: [`arn:aws:s3:::${bucketName}/*`],
      },
    ],
  };

  try {
    await s3Client.send(
      new PutBucketPolicyCommand({
        Bucket: bucketName,
        Policy: JSON.stringify(policy),
      })
    );
    console.log(`Successfully set bucket ${bucketName} to public read access.`);
  } catch (err) {
    console.error("Failed to set bucket policy:", err);
  }
}

makeBucketPublic();
