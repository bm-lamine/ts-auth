import { defineConfig } from "drizzle-kit";
import { env } from "src/common/config/env";

export default defineConfig({
  dialect: "postgresql",
  dbCredentials: { url: env.DATABASE_URL },
  schema: "./src/common/db/schema.ts",
  out: "./out/migrations",
  strict: true,
});
