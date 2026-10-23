import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts",
  },
  datasource: {
    // CLI/migration commands (migrate deploy, migrate dev, studio, etc.)
    // use DIRECT_DATABASE_URL when set — Neon's pooled connection doesn't
    // reliably support the session-level advisory lock `migrate deploy`
    // takes, which was causing recurring P1002 timeouts on Vercel builds.
    // Only set in production (Vercel); locally this is always unset, so
    // it falls back to DATABASE_URL (local Postgres, no pooler, no issue).
    // The app's own runtime connection (src/lib/db/prisma.ts) is entirely
    // separate from this file and keeps using the pooled DATABASE_URL —
    // this only changes what the CLI uses at build/migrate time.
    url: process.env["DIRECT_DATABASE_URL"] ?? process.env["DATABASE_URL"],
  },
});
