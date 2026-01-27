import crypto from "crypto";

export namespace HashService {
  export const hash = async (plain: string) =>
    await Bun.password.hash(plain, "argon2id");

  export const verify = async (plain: string, hash: string) =>
    await Bun.password.verify(plain, hash, "argon2id");

  export const hashToken = (token: string) =>
    crypto.createHash("sha256").update(token).digest("hex");

  export const hashUA = (ua: string) =>
    crypto.createHash("sha256").update(ua).digest("hex");

  export const hashIP = (ip: string) =>
    crypto.createHash("sha256").update(ip).digest("hex");
}
