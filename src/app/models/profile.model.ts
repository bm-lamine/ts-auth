import { schema } from "common/db";
import * as model from "drizzle-zod";
import z from "zod";

export namespace ProfileModel {
  export const select = model.createSelectSchema(schema.profiles, {
    userId: z.nanoid(),
  });

  export const insert = model
    .createInsertSchema(schema.profiles)
    .omit({ createdAt: true, updatedAt: true });

  export const update = model
    .createUpdateSchema(schema.profiles)
    .omit({ createdAt: true, updatedAt: true, userId: true });

  export const response = model
    .createSelectSchema(schema.profiles)
    .omit({ userId: true })
    .transform((u) => u);
}

export type TProfile = z.infer<typeof ProfileModel.select>;
export type TInsertProfile = z.infer<typeof ProfileModel.insert>;
export type TUpdateProfile = z.infer<typeof ProfileModel.update>;
export type TResponseProfile = z.infer<typeof ProfileModel.response>;
