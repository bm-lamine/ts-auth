import z from "zod";

export namespace AuthModel {
  export const intentJson = z.object({
    email: z.email().trim(),
    // rememberMe: z.coerce.boolean(),
  });

  export const callbackQuery = z.object({
    token: z.string().trim(),
  });

  export const payloadJson = z.object({
    sub: z.string(),
  });
}

export type TPayload = z.infer<typeof AuthModel.payloadJson>;
export type TIntent = z.infer<typeof AuthModel.intentJson>;
export type QCallback = z.infer<typeof AuthModel.callbackQuery>;
