import { env } from "common/config/env";
import Redis from "ioredis";
import type { ZodType } from "zod";

export namespace Cache {
  export const redis = new Redis(env.REDIS_URL);

  export async function get<T extends ZodType>(key: string, schema: T) {
    const stored = await redis.get(key);
    if (!stored) return null;

    const parsed = schema.safeParse(JSON.parse(stored));
    if (!parsed.success) return null;

    return parsed.data;
  }
}
