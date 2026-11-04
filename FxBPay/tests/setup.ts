import { execSync } from "node:child_process";

process.env.DATABASE_URL = process.env.TEST_DATABASE_URL ?? "postgres://fxb:fxb@localhost:5432/fxbpay_test";
process.env.APP_URL = "http://localhost:3000";
(process.env as Record<string, string>).NODE_ENV = "test";

const g = globalThis as unknown as { __fxbMigrated?: boolean };
if (!g.__fxbMigrated) {
  // Skema bersih untuk setiap file tes.
  execSync(`psql "${process.env.DATABASE_URL}" -q -c "DROP SCHEMA IF EXISTS public CASCADE; DROP SCHEMA IF EXISTS drizzle CASCADE; CREATE SCHEMA public;"`, { stdio: "ignore" });
  execSync("npx tsx scripts/migrate.ts", { stdio: "ignore", env: process.env });
  g.__fxbMigrated = true;
}
