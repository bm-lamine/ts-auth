import z from "zod";

export namespace AuthModel {
  export const payloadJson = z.object({ sub: z.string() });
  export const refreshJson = z.object({ refreshToken: z.string().trim() });
}

export type TPayload = z.infer<typeof AuthModel.payloadJson>;
