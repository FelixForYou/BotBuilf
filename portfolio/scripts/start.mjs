// Menjalankan server produksi. Port diambil dari PORT, lalu SERVER_PORT (Pterodactyl), lalu 3000.
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { openDatabase, dataDir } from "../db/open.mjs";

const port = process.env.PORT || process.env.SERVER_PORT || "3000";
const host = process.env.HOST || "0.0.0.0";

if (!fs.existsSync(path.join(process.cwd(), ".next", "BUILD_ID"))) {
  console.error("Belum ada hasil build. Jalankan `npm run build` dulu.");
  process.exit(1);
}

// Pastikan database siap (migrasi otomatis) dan beri tahu bila akun admin belum dibuat.
const db = openDatabase();
const admins = db.prepare("SELECT COUNT(*) AS n FROM admins").get().n;
db.close();
console.log(`Data: ${dataDir()}`);
if (!admins) console.warn("Peringatan: belum ada akun admin. Jalankan `npm run setup` untuk membuatnya.");

const require = createRequire(import.meta.url);
const nextBin = require.resolve("next/dist/bin/next");
const child = spawn(process.execPath, [nextBin, "start", "-H", host, "-p", String(port)], {
  stdio: "inherit",
  env: { ...process.env, NODE_OPTIONS: `${process.env.NODE_OPTIONS ?? ""} --disable-warning=ExperimentalWarning`.trim() },
});
for (const sig of ["SIGINT", "SIGTERM"]) process.on(sig, () => child.kill(sig));
child.on("exit", (code) => process.exit(code ?? 0));
