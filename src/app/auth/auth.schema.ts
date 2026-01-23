import z from "zod";

export const signUpSchema = z.object({
  email: z.email().trim(),
  password: z.string().trim(),
});

export const signInSchema = z.object({
  email: z.email().trim(),
  password: z.string().trim(),
});

export const refreshSchema = z.object({
  refreshToken: z.string().trim(),
});

export const jwtPayloadSchema = z.object({ userId: z.string() });

export type SignUp = z.infer<typeof signUpSchema>;
export type SignIn = z.infer<typeof signInSchema>;
export type JwtPayload = z.infer<typeof jwtPayloadSchema>;
