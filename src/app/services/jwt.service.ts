import type { TPayload } from "app/models/auth.model";
import { AuthModel } from "app/models/auth.model";
import { env } from "common/config/env";
import { Cache } from "common/utils/cache";
import { HTTPException } from "hono/http-exception";
import { sign, verify } from "hono/jwt";
import { TTL } from "lib/constants";
import { STATUS_CODE } from "lib/status-code";
import { HashService } from "./hash.service";

export namespace JwtService {
  export const KEYS = {
    USER_SID: (userId: string) => `auth:sid:${userId}`,
  } as const;

  export const TTLS = {
    ACCESS: TTL["5m"],
    REFRESH: TTL["7d"],
  } as const;

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
    const accessToken = await signToken({ sub: userId }, TTLS.ACCESS);
    const refreshToken = await signToken({ sub: userId }, TTLS.REFRESH);

    await Cache.redis
      .multi()
      .sadd(KEYS.USER_SID(userId), HashService.hashToken(refreshToken))
      .expire(KEYS.USER_SID(userId), TTLS.REFRESH, "NX")
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

    const exists = await Cache.redis.sismember(
      KEYS.USER_SID(payload.sub),
      HashService.hashToken(token),
    );

    if (!exists) {
      throw new HTTPException(STATUS_CODE.UNAUTHORIZED, {
        message: "token reuse detected",
      });
    }

    const accessToken = await signToken({ sub: payload.sub }, TTLS.ACCESS);
    const refreshToken = await signToken({ sub: payload.sub }, TTLS.REFRESH);

    await Cache.redis
      .multi()
      .srem(KEYS.USER_SID(payload.sub), HashService.hashToken(token))
      .sadd(KEYS.USER_SID(payload.sub), HashService.hashToken(refreshToken))
      .expire(KEYS.USER_SID(payload.sub), TTLS.REFRESH, "NX")
      .exec();

    return { accessToken, refreshToken };
  }

  export async function revoke(userId: string, token?: string) {
    if (token) {
      await Cache.redis.srem(
        KEYS.USER_SID(userId),
        HashService.hashToken(token),
      );
    } else {
      await Cache.redis.del(KEYS.USER_SID(userId));
    }
  }
}
