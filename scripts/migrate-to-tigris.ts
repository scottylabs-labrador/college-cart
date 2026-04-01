import { Client } from "pg";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import * as dotenv from "dotenv";
import { join } from "path";

// Load .env.local
dotenv.config({ path: join(process.cwd(), ".env.local") });

const bucketName = process.env.TIGRIS_BUCKET_NAME;
const endpoint = process.env.TIGRIS_ENDPOINT;
const accessKeyId = process.env.TIGRIS_ACCESS_KEY_ID;
const secretAccessKey = process.env.TIGRIS_SECRET_ACCESS_KEY;
const databaseUrl = process.env.DATABASE_URL;

if (!bucketName || !endpoint || !accessKeyId || !secretAccessKey || !databaseUrl) {
  console.error("Missing required environment variables. Check .env.local");
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

async function migrate() {
  const pgClient = new Client({
    connectionString: databaseUrl,
  });

  try {
    await pgClient.connect();
    console.log("Connected to database.");

    // Fetch all images that need migration
    // We look for rows where storage->'base64' exists
    const res = await pgClient.query(`
      SELECT image_id, storage, listing_id
      FROM listing_image
      WHERE storage->>'base64' IS NOT NULL
    `);

    const rows = res.rows;
    console.log(`Found ${rows.length} images to migrate.`);

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const { image_id, storage, listing_id } = row;
        const { base64, name, type } = storage;

        console.log(`[${i + 1}/${rows.length}] Migrating image ${image_id} for listing ${listing_id}...`);

        try {
            const buffer = Buffer.from(base64, "base64");
            const key = `listings/${Date.now()}-${name.replace(/\s+/g, "-")}`;

            await s3Client.send(
                new PutObjectCommand({
                    Bucket: bucketName,
                    Key: key,
                    Body: buffer,
                    ContentType: type || "image/jpeg",
                    ACL: 'public-read',
                })
            );

            const publicUrl = `https://${bucketName}.fly.storage.tigris.dev/${key}`;

            // Update the row in the database
            // We use jsonb_set to add/update the url field in the storage JSONB column
            await pgClient.query(`
                UPDATE listing_image
                SET storage = jsonb_set(storage, '{url}', $1::jsonb)
                WHERE image_id = $2
            `, [JSON.stringify(publicUrl), image_id]);

            console.log(`Successfully migrated to ${publicUrl}`);
        } catch (err) {
            console.error(`Failed to migrate image ${image_id}:`, err);
        }
    }

    console.log("Migration complete.");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await pgClient.end();
  }
}

migrate();
