import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL belum diatur");
const pool = new Pool({ connectionString: url, ssl: process.env.DATABASE_SSL === "1" ? { rejectUnauthorized: process.env.DATABASE_SSL_INSECURE !== "1" } : undefined });
await migrate(drizzle(pool), { migrationsFolder: new URL("../drizzle", import.meta.url).pathname });
console.log("Migrasi selesai.");
await pool.end();
