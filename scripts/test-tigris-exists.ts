import { S3Client, HeadObjectCommand } from "@aws-sdk/client-s3";
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

async function testHead() {
  try {
    // Check one of the migrated images
    const res = await s3Client.send(
      new HeadObjectCommand({
        Bucket: bucketName,
        Key: "listings/1775011757454-Screenshot-2026-03-22-at-13.35.04.png",
      })
    );
    console.log("SUCCESS: Image exists in Tigris and is accessible with credentials.");
    console.log("Metadata:", res.Metadata);
  } catch (err) {
    console.error("FAILURE: Image does not exist or is not accessible even with credentials.", err);
  }
}

testHead();
