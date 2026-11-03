// Membuka database SQLite (modul bawaan Node, tanpa dependency native).
// Dipakai oleh aplikasi Next.js dan skrip terminal.
import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { migrate } from "./schema.mjs";

export function dataDir() {
  const dir = path.resolve(/* turbopackIgnore: true */ process.env.DATA_DIR || path.join(/* turbopackIgnore: true */ process.cwd(), "data"));
  fs.mkdirSync(path.join(dir, "uploads"), { recursive: true });
  return dir;
}

export function uploadsDir() {
  return path.join(dataDir(), "uploads");
}

export function openDatabase() {
  const file = path.join(dataDir(), "felixiority.db");
  const db = new DatabaseSync(file);
  db.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;");
  migrate(db);
  return db;
}
