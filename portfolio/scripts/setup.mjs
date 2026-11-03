// Inisialisasi database + data awal + pembuatan akun admin.
import path from "node:path";
import { openDatabase, dataDir } from "../db/open.mjs";
import { hashPassword, usernameProblem } from "../db/password.mjs";
import { ask, askNewPassword } from "./prompt.mjs";

const db = openDatabase();
console.log("\nFELIXIORITY · setup");
console.log(`Database siap: ${path.join(dataDir(), "felixiority.db")}`);
console.log("Tabel dan data project awal sudah dibuat.\n");

const admins = db.prepare("SELECT COUNT(*) AS n FROM admins").get().n;
if (admins > 0) {
  const ans = await ask(`Sudah ada ${admins} akun admin. Tambah akun baru? (y/N) `);
  if (!/^y/i.test(ans)) {
    console.log("Selesai. Pakai `npm run reset-password` untuk mengganti password.");
    process.exit(0);
  }
}

let username = "";
for (let i = 0; i < 5; i++) {
  username = await ask("Username admin: ");
  const problem = usernameProblem(username);
  if (problem) { console.log("  " + problem); username = ""; continue; }
  if (db.prepare("SELECT 1 FROM admins WHERE username = ?").get(username)) { console.log("  Username sudah dipakai."); username = ""; continue; }
  break;
}
if (!username) { console.log("Setup dibatalkan."); process.exit(1); }

const password = await askNewPassword();
db.prepare("INSERT INTO admins (username, password_hash) VALUES (?, ?)").run(username, hashPassword(password));
console.log(`\nAkun admin "${username}" dibuat. Login di /admin/login setelah aplikasi berjalan.`);
db.close();
process.exit(0);
