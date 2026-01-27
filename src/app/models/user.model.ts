import { schema } from "common/db";
import * as model from "drizzle-zod";
import z from "zod";

export namespace UserModel {
  export const select = model.createSelectSchema(schema.users, {
    email: z.email(),
  });

  export const insert = model
    .createInsertSchema(schema.users, { email: z.email() })
    .omit({ id: true });

  export const json = model
    .createSelectSchema(schema.users, { email: z.email() })
    .transform((u) => u);
}

export type TUser = z.infer<typeof UserModel.select>;
export type JUser = z.infer<typeof UserModel.json>;
export type TInsertUser = z.infer<typeof UserModel.insert>;
