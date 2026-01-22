import { env } from "common/config/env";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  dbCredentials: { url: env.DATABASE_URL },
  schema: "./src/common/db/schema.ts",
  out: "./out/migrations",
  strict: true,
});
