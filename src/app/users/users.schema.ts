import { schema } from "common/db";
import * as drizzleZod from "drizzle-zod";
import z from "zod";

export const selectUserSchema = drizzleZod.createSelectSchema(schema.users, {
  id: z.nanoid(),
  email: z.email(),
});

export const createUserSchema = drizzleZod
  .createInsertSchema(schema.users, { email: z.email() })
  .omit({ id: true });

export const updateUserSchema = drizzleZod
  .createUpdateSchema(schema.users, { email: z.email().optional() })
  .omit({ id: true });

export const userJsonSchema = drizzleZod
  .createSelectSchema(schema.users)
  .omit({ hash: true })
  .transform((u) => u);

export type User = z.infer<typeof selectUserSchema>;
export type CreateUserSchema = z.infer<typeof createUserSchema>;
export type UpdateUserSchema = z.infer<typeof updateUserSchema>;
