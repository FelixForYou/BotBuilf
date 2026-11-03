// Mengganti password admin lewat terminal. Semua sesi aktif akun itu ikut dikeluarkan.
import { openDatabase } from "../db/open.mjs";
import { hashPassword } from "../db/password.mjs";
import { ask, askNewPassword } from "./prompt.mjs";

const db = openDatabase();
const list = db.prepare("SELECT id, username FROM admins ORDER BY id").all();
if (!list.length) {
  console.log("Belum ada akun admin. Jalankan `npm run setup` dulu.");
  process.exit(1);
}
console.log("Akun admin: " + list.map((a) => a.username).join(", "));
const username = list.length === 1 ? list[0].username : await ask("Username yang akan direset: ");
const admin = db.prepare("SELECT id, username FROM admins WHERE username = ?").get(username);
if (!admin) { console.log("Username tidak ditemukan."); process.exit(1); }

console.log(`Reset password untuk "${admin.username}".`);
const password = await askNewPassword();
db.prepare("UPDATE admins SET password_hash = ?, updated_at = datetime('now') WHERE id = ?").run(hashPassword(password), admin.id);
db.prepare("DELETE FROM sessions WHERE admin_id = ?").run(admin.id);
db.prepare("DELETE FROM login_attempts").run();
console.log("Password diperbarui. Sesi lama sudah dikeluarkan dan kunci login dibuka.");
db.close();
process.exit(0);
