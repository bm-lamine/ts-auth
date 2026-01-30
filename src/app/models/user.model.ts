import { schema } from "common/db";
import * as model from "drizzle-zod";
import z from "zod";
import { PermissionModel } from "./permission.model";

export namespace UserModel {
  export const select = model.createSelectSchema(schema.users, {
    email: z.email(),
    ipAddress: z.ipv4().nullable(),
  });

  export const insert = model
    .createInsertSchema(schema.users, { email: z.email() })
    .omit({ id: true });

  export const role = z.object({
    isSuperAdmin: z.coerce.boolean().default(false),
    permissions: z.array(PermissionModel.cache),
  });

  export const authz = select.pick({ id: true }).extend(role.shape);
}

export type TUser = z.infer<typeof UserModel.select>;
export type TInsertUser = z.infer<typeof UserModel.insert>;
export type TAuthUser = z.infer<typeof UserModel.authz>;
export type TRole = z.infer<typeof UserModel.role>;
