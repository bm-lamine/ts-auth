import { env } from "common/config/env";
import redis from "common/utils/redis";
import crypto from "crypto";
import { HTTPException } from "hono/http-exception";
import { sign, verify } from "hono/jwt";
import { STATUS_CODE } from "lib/status-code";
import { nanoid } from "nanoid";
import {
  jwtPayloadJson,
  type JwtPayload,
  type VerificationEnum,
} from "./auth.schema";

export const ACCESS_TTL = 5 * 60;
export const REFRESH_TTL = 7 * 24 * 60 * 60;
export const VERIFICATION_TTL = 10 * 60;

export const USER_SID = (userId: string) => `auth:sid:${userId}`;
export const VERIFICATION_KEY = (email: string, type: VerificationEnum) =>
  `auth:otp:${type}:${email}`;

export const hashText = async (plain: string) =>
  await Bun.password.hash(plain, "bcrypt");

export const hashToken = (token: string) =>
  crypto.createHash("sha256").update(token).digest("hex");

export const verifyHash = async (plain: string, hash: string) =>
  await Bun.password.verify(plain, hash, "bcrypt");

export async function signJwt(payload: JwtPayload, ttl: number) {
  const now = Math.floor(Date.now() / 1000);
  return await sign({ ...payload, iat: now, exp: now + ttl }, env.JWT_SECRET);
}

export async function verifyJwt(token: string) {
  try {
    const payload = await verify(token, env.JWT_SECRET);
    const parsed = jwtPayloadJson.safeParse(payload);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export async function issueToken(userId: string) {
  return await Promise.all([
    signJwt({ jti: nanoid(), userId }, ACCESS_TTL),
    signJwt({ jti: nanoid(), userId }, REFRESH_TTL),
  ]);
}

export async function authenticate(userId: string) {
  const [accessToken, refreshToken] = await issueToken(userId);

  await redis
    .multi()
    .sadd(USER_SID(userId), hashToken(refreshToken))
    .expire(USER_SID(userId), REFRESH_TTL, "NX")
    .exec();

  return { accessToken, refreshToken };
}

export async function refreshAuth(token: string) {
  const payload = await verifyJwt(token);
  if (!payload) {
    throw new HTTPException(STATUS_CODE.UNAUTHORIZED, {
      message: "invalid token issued",
    });
  }

  const exists = await redis.sismember(
    USER_SID(payload.userId),
    hashToken(token),
  );

  if (!exists) {
    throw new HTTPException(STATUS_CODE.UNAUTHORIZED, {
      message: "token reuse detected",
    });
  }

  const [accessToken, refreshToken] = await issueToken(payload.userId);

  await redis
    .multi()
    .srem(USER_SID(payload.userId), hashToken(token))
    .sadd(USER_SID(payload.userId), hashToken(refreshToken))
    .expire(USER_SID(payload.userId), REFRESH_TTL, "NX")
    .exec();

  return { accessToken, refreshToken };
}

export async function logout(userId: string, token: string) {
  const removed = await redis.srem(USER_SID(userId), hashToken(token));
  if (!removed) {
    throw new HTTPException(STATUS_CODE.NOT_FOUND, {
      message: "token not found or already revoked",
    });
  }
}

export async function createOtp({ email, type }: CreateOtpOpts) {
  const otp = nanoid(env.OTP_SIZE);

  await redis
    .multi()
    .set(VERIFICATION_KEY(email, type), hashToken(otp))
    .expire(VERIFICATION_KEY(email, type), VERIFICATION_TTL)
    .exec();

  return otp;
}

export async function verifyOtp({ email, otp, type }: VerifyOtpOpts) {
  const stored = await redis.get(VERIFICATION_KEY(email, type));
  const valid = Boolean(!stored || stored !== hashToken(otp));
  if (valid) await redis.del(VERIFICATION_KEY(email, type));
  return valid;
}

export type CreateOtpOpts = {
  email: string;
  type: VerificationEnum;
};

export type VerifyOtpOpts = {
  email: string;
  otp: string;
  type: VerificationEnum;
};
