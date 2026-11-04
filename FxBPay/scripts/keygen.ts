import { generateKeyPairSync, randomBytes } from "node:crypto";

const mode = process.argv[2] ?? "secrets";
if (mode === "rsa") {
  // Pasangan kunci RSA 2048 untuk didaftarkan ke Merchant Portal DANA (public key) — simpan private key secara aman.
  const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048, publicKeyEncoding: { type: "spki", format: "pem" }, privateKeyEncoding: { type: "pkcs8", format: "pem" } });
  console.log("# PUBLIC KEY (unggah ke Merchant Portal DANA):\n" + publicKey);
  console.log("# PRIVATE KEY (tempel di Admin → Pengaturan DANA, JANGAN commit):\n" + privateKey);
} else {
  console.log(`APP_ENCRYPTION_KEY=${randomBytes(32).toString("base64")}`);
  console.log(`CRON_SECRET=${randomBytes(24).toString("base64url")}`);
  console.log(`SETUP_TOKEN=${randomBytes(24).toString("base64url")}`);
}
