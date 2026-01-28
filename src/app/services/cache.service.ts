import { env } from "common/config/env";
import Redis from "ioredis";
import { TTL } from "lib/constants";
import type { ZodType } from "zod";

export namespace CacheService {
  export const redis = new Redis(env.REDIS_URL);

  export const KEYS = {
    USERS: "auth:users",
    ACCOUNTS: "auth:accounts",
    USER_ID: (id: string) => `auth:user:id:${id}`,
    USER_EMAIL: (email: string) => `auth:user:email:${email}`,
    ACCOUNT_USERNAME: (username: string) => `auth:account:username:${username}`,
    ACCOUNT_USERID: (userId: string) => `auth:account:userId:${userId}`,
    INTENT_HASH: (hash: string) => `auth:intent:${hash}`,
    USER_SID: (userId: string) => `auth:sid:${userId}`,
    USER_PERMISSIONS: (userId: string) => `auth:user:permissions:${userId}`,
  } as const;

  export const TTLS = {
    ACCOUNT: TTL["5m"],
    ACCOUNTS: TTL["7d"],
    USER_PERMISSIONS: TTL["1d"],
    ACCESS: TTL["5m"],
    REFRESH: TTL["7d"],
    INTENT_HASH: TTL["15m"],
    USER: TTL["5m"],
    USERS: TTL["7d"],
  } as const;

  export async function get<T extends ZodType>(key: string, schema: T) {
    const stored = await redis.get(key);
    if (!stored) return null;

    const parsed = schema.safeParse(JSON.parse(stored));
    if (!parsed.success) return null;

    return parsed.data;
  }
}
