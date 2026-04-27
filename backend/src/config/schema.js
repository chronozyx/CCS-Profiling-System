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

    // Remove comments and clean up the SQL
    const cleanedSQL = schemaSQL
      .split("\n")
      .filter((line) => !line.trim().startsWith("--") && line.trim() !== "")
      .join("\n")
      .replace(/\n+/g, " ") // Replace multiple newlines with space
      .trim();

    // Split into statements by semicolon
    const statements = cleanedSQL
      .split(";")
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0);

    // Execute each statement
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await conn.query(statement);
        } catch (err) {
          console.error(
            "❌ Error executing statement:",
            statement.substring(0, 100) + "...",
          );
          throw err;
        }
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
