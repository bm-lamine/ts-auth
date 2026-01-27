import { foreignKey, index, pgSchema } from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";

export const auth = pgSchema("auth");

export const users = auth.table(
  "users",
  (c) => ({
    id: c.varchar().primaryKey().$defaultFn(nanoid),
    email: c.varchar().notNull().unique(),
    userAgent: c.varchar().notNull(),
    ipAddress: c.varchar(),
  }),
  (t) => [index("usr_email_idx").on(t.email)],
);

export const accounts = auth.table(
  "accounts",
  (c) => ({
    userId: c.varchar().primaryKey(),
    username: c.varchar().notNull().unique(),
    createdAt: c
      .timestamp({ withTimezone: true, mode: "date" })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: c
      .timestamp({ withTimezone: true, mode: "date" })
      .$onUpdateFn(() => new Date()),
  }),
  (t) => [
    foreignKey({ columns: [t.userId], foreignColumns: [users.id] }),
    index("acc_userId_idx").on(t.userId),
    index("acc_username_idx").on(t.username),
  ],
);
