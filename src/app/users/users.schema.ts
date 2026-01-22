import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { schema } from "common/db";
import z from "zod";

export default class UsersSchema {
  static selectOne = createSelectSchema(schema.users, {
    id: z.nanoid(),
    email: z.email(),
  });

  static createOne = createInsertSchema(schema.users, {
    email: z.email(),
  });
}

export type User = z.infer<typeof UsersSchema.selectOne>;
export type CreateUser = z.infer<typeof UsersSchema.createOne>;
