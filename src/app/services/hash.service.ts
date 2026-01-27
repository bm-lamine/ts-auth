import crypto from "crypto";

export namespace HashService {
  export const hash = async (plain: string) =>
    await Bun.password.hash(plain, "argon2d");

  export const verify = async (plain: string, hash: string) =>
    await Bun.password.verify(plain, hash, "argon2d");

  export const hashToken = (token: string) =>
    crypto.createHash("sha256").update(token).digest("hex");
}
