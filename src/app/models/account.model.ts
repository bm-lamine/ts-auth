import { schema } from "common/db";
import * as model from "drizzle-zod";
import z from "zod";

export namespace AccountModel {
  export const select = model.createSelectSchema(schema.accounts, {
    userId: z.nanoid(),
  });

  export const insert = model
    .createInsertSchema(schema.accounts)
    .omit({ createdAt: true, updatedAt: true });

  export const update = model
    .createUpdateSchema(schema.accounts)
    .omit({ createdAt: true, updatedAt: true, userId: true });

  export const response = model
    .createSelectSchema(schema.accounts)
    .omit({ userId: true })
    .transform((u) => u);
}

export type TAccount = z.infer<typeof AccountModel.select>;
export type TInsertAccount = z.infer<typeof AccountModel.insert>;
export type TUpdateAccount = z.infer<typeof AccountModel.update>;
export type TResponseAccount = z.infer<typeof AccountModel.response>;
