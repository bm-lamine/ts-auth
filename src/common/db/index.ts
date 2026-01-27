import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { env } from "common/config/env";
import { isProd } from "lib/constants";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as { conn: postgres.Sql | undefined };
const conn = globalForDb.conn ?? postgres(env.DATABASE_URL);
if (!isProd) globalForDb.conn = conn;

export const db = drizzle(conn, { schema });
export { schema };
