import { Client } from "pg";
import * as dotenv from "dotenv";
import { join } from "path";

dotenv.config({ path: join(process.cwd(), ".env.local") });

async function checkSchema() {
  const pgClient = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await pgClient.connect();
    const res = await pgClient.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'listing_image'
    `);
    console.log("Columns in listing_image:", res.rows.map(r => r.column_name));
  } catch (err) {
    console.error("Failed to check schema:", err);
  } finally {
    await pgClient.end();
  }
}

checkSchema();
