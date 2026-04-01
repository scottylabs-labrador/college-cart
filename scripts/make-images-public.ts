import { S3Client, PutObjectAclCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
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

async function makeImagesPublic() {
  try {
    const listRes = await s3Client.send(
      new ListObjectsV2Command({
        Bucket: bucketName,
        Prefix: "listings/",
      })
    );

    if (!listRes.Contents || listRes.Contents.length === 0) {
      console.log("No images found in listings/ prefix.");
      return;
    }

    console.log(`Found ${listRes.Contents.length} objects. Setting ACL to public-read...`);

    for (const obj of listRes.Contents) {
      if (!obj.Key) continue;
      console.log(`Setting ACL for ${obj.Key}...`);
      try {
        await s3Client.send(
          new PutObjectAclCommand({
            Bucket: bucketName,
            Key: obj.Key,
            ACL: "public-read",
          })
        );
        console.log(`Successfully set ACL for ${obj.Key}`);
      } catch (err) {
        console.error(`Failed to set ACL for ${obj.Key}:`, err);
      }
    }
  } catch (err) {
    console.error("Error listing or updating objects:", err);
  }
}

makeImagesPublic();
