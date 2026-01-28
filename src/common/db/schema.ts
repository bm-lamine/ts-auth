import { foreignKey, index, pgSchema, primaryKey } from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";

export const auth = pgSchema("auth");

export const users = auth.table(
  "users",
  (c) => ({
    id: c.varchar().primaryKey().$defaultFn(nanoid),
    email: c.varchar().notNull().unique(),
    userAgent: c.varchar().notNull(),
    ipAddress: c.varchar(),
    createdAt: c
      .timestamp({ withTimezone: true, mode: "date" })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: c
      .timestamp({ withTimezone: true, mode: "date" })
      .$onUpdateFn(() => new Date()),
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

export const roles = auth.table("roles", (c) => ({
  id: c.varchar().primaryKey().$defaultFn(nanoid),
  name: c.varchar().notNull().unique(),
  isSystem: c.boolean().notNull().default(false),
  isSuperAdmin: c.boolean().notNull().default(false),
  createdAt: c
    .timestamp({ withTimezone: true, mode: "date" })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: c
    .timestamp({ withTimezone: true, mode: "date" })
    .$onUpdateFn(() => new Date()),
}));

export const permissions = auth.table("permissions", (c) => ({
  id: c.varchar().primaryKey().$defaultFn(nanoid),
  name: c.varchar().notNull(),
  // rule is domain.action, ex: account.update
  rule: c.varchar().notNull().unique(),
  scope: c.varchar({ enum: ["self", "project", "global"] }),
  description: c.varchar().notNull(),
  createdAt: c
    .timestamp({ withTimezone: true, mode: "date" })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: c
    .timestamp({ withTimezone: true, mode: "date" })
    .$onUpdateFn(() => new Date()),
}));

export const usersRoles = auth.table(
  "users_roles",
  (c) => ({
    userId: c.varchar().notNull(),
    roleId: c.varchar().notNull(),
    createdAt: c
      .timestamp({ withTimezone: true, mode: "date" })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: c
      .timestamp({ withTimezone: true, mode: "date" })
      .$onUpdateFn(() => new Date()),
  }),
  (t) => [
    primaryKey({ columns: [t.userId, t.roleId] }),
    foreignKey({ columns: [t.userId], foreignColumns: [users.id] }),
    foreignKey({ columns: [t.roleId], foreignColumns: [roles.id] }),
  ],
);

export const rolesPermission = auth.table(
  "roles_permissions",
  (c) => ({
    roleId: c.varchar().notNull(),
    permissionId: c.varchar().notNull(),
    createdAt: c
      .timestamp({ withTimezone: true, mode: "date" })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: c
      .timestamp({ withTimezone: true, mode: "date" })
      .$onUpdateFn(() => new Date()),
  }),
  (t) => [
    primaryKey({ columns: [t.permissionId, t.roleId] }),
    foreignKey({ columns: [t.roleId], foreignColumns: [roles.id] }),
    foreignKey({ columns: [t.permissionId], foreignColumns: [permissions.id] }),
  ],
);
