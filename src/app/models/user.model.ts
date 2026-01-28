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

  export const rules = z.object({
    permissions: z.array(z.string().nullable()).default([]),
    isSuperAdmin: z.boolean().default(false),
  });

  export const auth = select.pick({ id: true }).extend(rules.shape);
}

export type TUser = z.infer<typeof UserModel.select>;
export type TInsertUser = z.infer<typeof UserModel.insert>;
export type TUserRules = z.infer<typeof UserModel.rules>;
export type TAuthUser = z.infer<typeof UserModel.auth>;
