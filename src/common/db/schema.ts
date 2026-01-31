import * as core from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";

export const auth = core.pgSchema("auth");

export const PERMISSION_SCOPE = auth.enum("permission_scope", [
  "self", //* Act only on resource they own,
  "project", //* Act only resource within shared context
  "global", //* Act on any resource, system-wide
]);

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
  (t) => [core.index("usr_email_idx").on(t.email)],
);

export const profiles = auth.table(
  "profiles",
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
    core.foreignKey({ columns: [t.userId], foreignColumns: [users.id] }),
    core.index("acc_userId_idx").on(t.userId),
    core.index("acc_username_idx").on(t.username),
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

export const permissions = auth.table(
  "permissions",
  (c) => ({
    id: c.varchar().primaryKey().$defaultFn(nanoid),
    name: c.varchar().notNull(),
    // rule is domain.action, ex: account.update
    rule: c.varchar().notNull(),
    scope: PERMISSION_SCOPE().notNull().default("global"),
    description: c.varchar().notNull(),
    createdAt: c
      .timestamp({ withTimezone: true, mode: "date" })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: c
      .timestamp({ withTimezone: true, mode: "date" })
      .$onUpdateFn(() => new Date()),
  }),
  (t) => [core.uniqueIndex("permission_unique_idx").on(t.rule, t.scope)],
);

export const usersRoles = auth.table(
  "users_roles",
  (c) => ({
    userId: c.varchar().notNull(),
    roleId: c.varchar().notNull(),
  }),
  (t) => [
    core.primaryKey({ columns: [t.userId, t.roleId] }),
    core.foreignKey({ columns: [t.userId], foreignColumns: [users.id] }),
    core.foreignKey({ columns: [t.roleId], foreignColumns: [roles.id] }),
  ],
);

export const rolesPermission = auth.table(
  "roles_permissions",
  (c) => ({
    roleId: c.varchar().notNull(),
    permissionId: c.varchar().notNull(),
  }),
  (t) => [
    core.primaryKey({ columns: [t.permissionId, t.roleId] }),
    core.foreignKey({ columns: [t.roleId], foreignColumns: [roles.id] }),
    core.foreignKey({
      columns: [t.permissionId],
      foreignColumns: [permissions.id],
    }),
  ],
);
