import { schema } from "common/db";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import z from "zod";

export const selectUserSchema = createSelectSchema(schema.users, {
  id: z.nanoid(),
  email: z.email(),
});

export const createUserSchema = createInsertSchema(schema.users, {
  email: z.email(),
});

export const userJsonSchema = createSelectSchema(schema.users)
  .omit({ hash: true })
  .transform((u) => u);

export type User = z.infer<typeof selectUserSchema>;
export type CreateUserSchema = z.infer<typeof createUserSchema>;
