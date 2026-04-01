import { Client } from "pg";
import * as dotenv from "dotenv";
import { join } from "path";
import https from "https";

dotenv.config({ path: join(process.cwd(), ".env.local") });

async function verifyMigration() {
  const pgClient = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await pgClient.connect();
    const res = await pgClient.query(`
      SELECT image_id, storage->>'url' as url, storage->>'base64' as has_base64
      FROM listing_image
    `);

    const rows = res.rows;
    let successCount = 0;
    let missingUrlCount = 0;
    let failedReachCount = 0;

    console.log(`Verifying ${rows.length} total images...\n`);

    for (const row of rows) {
      if (!row.url) {
        console.error(`❌ Image ${row.image_id} is missing a Tigris URL!`);
        missingUrlCount++;
        continue;
      }

      // Check if the URL is reachable
      const isReachable = await new Promise((resolve) => {
        https.get(row.url, (res) => {
          resolve(res.statusCode === 200);
        }).on('error', () => resolve(false));
      });

      if (isReachable) {
        successCount++;
      } else {
        console.error(`❌ Image ${row.image_id} has a URL but it is NOT reachable: ${row.url}`);
        failedReachCount++;
      }
    }

    console.log(`\n--- Verification Report ---`);
    console.log(`✅ Successfully Migrated & Reachable: ${successCount}`);
    if (missingUrlCount > 0) console.log(`⚠️ Missing Tigris URLs: ${missingUrlCount}`);
    if (failedReachCount > 0) console.log(`🚨 Unreachable URLs: ${failedReachCount}`);
    
    if (missingUrlCount === 0 && failedReachCount === 0) {
      console.log(`\n🎉 CONFIDENCE HIGH: All images are safely hosted on Tigris.`);
      console.log(`You can now safely clear the 'base64' field in your 'listing_image' table.`);
    } else {
      console.log(`\n❌ DO NOT DELETE: Some images are not fully migrated or reachable.`);
    }

  } catch (err) {
    console.error("Verification failed:", err);
  } finally {
    await pgClient.end();
  }
}

verifyMigration();
