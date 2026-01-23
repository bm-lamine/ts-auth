import { index, pgSchema } from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";

export const auth = pgSchema("auth");

export const users = auth.table(
  "users",
  (c) => ({
    id: c.varchar().primaryKey().$defaultFn(nanoid),
    email: c.varchar().notNull().unique(),
    hash: c.varchar().notNull(),
    email_verified: c.boolean().notNull().default(false),
  }),
  (t) => [index("usr_email_idx").on(t.email)],
);
