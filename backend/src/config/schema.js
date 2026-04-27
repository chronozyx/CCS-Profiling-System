import pool from "./db.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runSchema() {
  const conn = await pool.getConnection();
  try {
    console.log("🏗️  Creating database schema...");

    // Read the schema.sql file
    const schemaPath = path.join(__dirname, "schema.sql");
    const schemaSQL = fs.readFileSync(schemaPath, "utf8");

    // Split into individual statements (basic approach)
    const statements = schemaSQL
      .split(";")
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0 && !stmt.startsWith("--"));

    // Execute each statement
    for (const statement of statements) {
      if (statement.trim()) {
        await conn.query(statement);
      }
    }

    console.log("✅ Database schema created successfully!");
  } catch (err) {
    console.error("❌ Schema creation error:", err.message);
    throw err;
  } finally {
    conn.release();
  }
}

runSchema()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
