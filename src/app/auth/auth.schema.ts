import z from "zod";

export const signUpJson = z.object({
  email: z.email().trim(),
  password: z.string().trim(),
});

export const signInJson = z.object({
  email: z.email().trim(),
  password: z.string().trim(),
});

export const refreshJson = z.object({
  refreshToken: z.string().trim(),
});

export const verificationEnum = z
  .enum(["email-verification", "password-reset"] as const)
  .default("email-verification");

export const verificationQuery = z.object({
  token: z.string().trim(),
  email: z.email().trim(),
  type: verificationEnum,
});

export const resendVerification = z.object({
  email: z.email().trim(),
  type: verificationEnum,
});

export const jwtPayloadJson = z.object({
  jti: z.nanoid(),
  userId: z.string(),
});

export type SignUp = z.infer<typeof signUpJson>;
export type SignIn = z.infer<typeof signInJson>;
export type JwtPayload = z.infer<typeof jwtPayloadJson>;
export type VerificationQuery = z.infer<typeof verificationQuery>;
export type VerificationEnum = z.infer<typeof verificationEnum>;
