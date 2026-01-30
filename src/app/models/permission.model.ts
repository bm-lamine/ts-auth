import { schema } from "common/db";
import * as model from "drizzle-zod";
import z from "zod";

export namespace PermissionModel {
  export const scope = {
    values: schema.PERMISSION_SCOPE.enumValues,
    levels: { self: 0, project: 1, global: 2 } as const,
  } as const;

  export const scopeEnum = z.enum(scope.values);
  export const select = model.createSelectSchema(schema.permissions);
  export const cache = select.pick({ rule: true, scope: true });
}

export type TPermission = z.infer<typeof PermissionModel.select>;
export type TPermissionScope = z.infer<typeof PermissionModel.scopeEnum>;
export type TPermissionCache = z.infer<typeof PermissionModel.cache>;
