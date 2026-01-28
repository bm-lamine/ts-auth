import { env } from "common/config/env";
import Redis from "ioredis";
import { TTL } from "lib/constants";
import type { ZodType } from "zod";

export namespace Cache {
  export const redis = new Redis(env.REDIS_URL);

  export const KEYS = {
    USER_PERMISSIONS: (userId: string) => `auth:user:permissions:${userId}`,
  } as const;

  export const TTLS = {
    USER_PERMISSIONS: TTL["1d"],
  } as const;

  export async function get<T extends ZodType>(key: string, schema: T) {
    const stored = await redis.get(key);
    if (!stored) return null;

    const parsed = schema.safeParse(JSON.parse(stored));
    if (!parsed.success) return null;

    return parsed.data;
  }
}
