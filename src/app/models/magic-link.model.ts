import z from "zod";

export namespace MagicLinkModel {
  export const payload = z.object({
    email: z.email(),
    uaHash: z.string(),
    ipHash: z.string().optional(),
  });

  export const intentJson = z.object({ email: z.email() });
  export const callbackQuery = z.object({ token: z.string().trim() });
}

export type TIntent = z.infer<typeof MagicLinkModel.intentJson>;
export type TMagicLinkPayload = z.infer<typeof MagicLinkModel.payload>;

export type TMagicLinkOptions = {
  email: string;
  userAgent: string;
  ipAddress?: string;
};

export type TMagicLinkConsumeOptions = {
  token: string;
  userAgent: string;
  ipAddress?: string;
};
