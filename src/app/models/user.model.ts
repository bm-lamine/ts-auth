import { schema } from "common/db";
import * as model from "drizzle-zod";
import z from "zod";

export namespace UserModel {
  export const select = model.createSelectSchema(schema.users, {
    email: z.email(),
    ipAddress: z.ipv4().nullable(),
  });

  export const insert = model
    .createInsertSchema(schema.users, { email: z.email() })
    .omit({ id: true });
}

export type TUser = z.infer<typeof UserModel.select>;
export type TInsertUser = z.infer<typeof UserModel.insert>;
