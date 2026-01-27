import type { TPayload } from "app/models/auth.model";
import { AuthModel } from "app/models/auth.model";
import { env } from "common/config/env";
import Cache from "common/utils/cache";
import { HTTPException } from "hono/http-exception";
import { sign, verify } from "hono/jwt";
import { STATUS_CODE } from "lib/status-code";
import { HashService } from "./hash.service";

export namespace JwtService {
  export const ACCESS_TTL = 5 * 60;
  export const REFRESH_TTL = 7 * 24 * 60 * 60;
  export const USER_SID = (userId: string) => `auth:sid:${userId}`;

  export async function signToken(payload: TPayload, ttl: number) {
    const now = Math.floor(Date.now() / 1000);
    return await sign({ ...payload, iat: now, exp: now + ttl }, env.JWT_SECRET);
  }

  export async function verifyToken(token: string) {
    try {
      const payload = await verify(token, env.JWT_SECRET);
      const parsed = AuthModel.payloadJson.safeParse(payload);
      return parsed.success ? parsed.data : null;
    } catch {
      return null;
    }
  }

  export async function authenticate(userId: string) {
    const accessToken = await signToken({ sub: userId }, ACCESS_TTL);
    const refreshToken = await signToken({ sub: userId }, REFRESH_TTL);

    await Cache.client
      .multi()
      .sadd(USER_SID(userId), HashService.hashToken(refreshToken))
      .expire(USER_SID(userId), REFRESH_TTL, "NX")
      .exec();

    return { accessToken, refreshToken };
  }

  export async function refreshTokens(token: string) {
    const payload = await verifyToken(token);
    if (!payload) {
      throw new HTTPException(STATUS_CODE.UNAUTHORIZED, {
        message: "invalid token issued",
      });
    }

    const exists = await Cache.client.sismember(
      USER_SID(payload.sub),
      HashService.hashToken(token),
    );

    if (!exists) {
      throw new HTTPException(STATUS_CODE.UNAUTHORIZED, {
        message: "token reuse detected",
      });
    }

    const accessToken = await signToken({ sub: payload.sub }, ACCESS_TTL);
    const refreshToken = await signToken({ sub: payload.sub }, REFRESH_TTL);

    await Cache.client
      .multi()
      .srem(USER_SID(payload.sub), HashService.hashToken(token))
      .sadd(USER_SID(payload.sub), HashService.hashToken(refreshToken))
      .expire(USER_SID(payload.sub), REFRESH_TTL, "NX")
      .exec();

    return { accessToken, refreshToken };
  }

  export async function revoke(userId: string, token: string) {
    await Cache.client.srem(USER_SID(userId), HashService.hashToken(token));
  }
}
