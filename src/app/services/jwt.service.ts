import type { TPayload } from "app/models/auth.model";
import { AuthModel } from "app/models/auth.model";
import { CacheService } from "app/services/cache.service";
import { env } from "common/config/env";
import { HTTPException } from "hono/http-exception";
import { sign, verify } from "hono/jwt";
import { STATUS_CODE } from "lib/status-code";
import { HashService } from "./hash.service";

export namespace JwtService {
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
    const accessToken = await signToken(
      { sub: userId },
      CacheService.TTLS.ACCESS,
    );
    const refreshToken = await signToken(
      { sub: userId },
      CacheService.TTLS.REFRESH,
    );

    await CacheService.redis
      .multi()
      .sadd(
        CacheService.KEYS.USER_SID(userId),
        HashService.hashToken(refreshToken),
      )
      .expire(
        CacheService.KEYS.USER_SID(userId),
        CacheService.TTLS.REFRESH,
        "NX",
      )
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

    const exists = await CacheService.redis.sismember(
      CacheService.KEYS.USER_SID(payload.sub),
      HashService.hashToken(token),
    );

    if (!exists) {
      throw new HTTPException(STATUS_CODE.UNAUTHORIZED, {
        message: "token reuse detected",
      });
    }

    const accessToken = await signToken(
      { sub: payload.sub },
      CacheService.TTLS.ACCESS,
    );
    const refreshToken = await signToken(
      { sub: payload.sub },
      CacheService.TTLS.REFRESH,
    );

    await CacheService.redis
      .multi()
      .srem(
        CacheService.KEYS.USER_SID(payload.sub),
        HashService.hashToken(token),
      )
      .sadd(
        CacheService.KEYS.USER_SID(payload.sub),
        HashService.hashToken(refreshToken),
      )
      .expire(
        CacheService.KEYS.USER_SID(payload.sub),
        CacheService.TTLS.REFRESH,
        "NX",
      )
      .exec();

    return { accessToken, refreshToken };
  }

  export async function revoke(userId: string, token?: string) {
    if (token) {
      await CacheService.redis.srem(
        CacheService.KEYS.USER_SID(userId),
        HashService.hashToken(token),
      );
    } else {
      await CacheService.redis.del(CacheService.KEYS.USER_SID(userId));
    }
  }
}
