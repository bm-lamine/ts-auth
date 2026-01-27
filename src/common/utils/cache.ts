import { env } from "common/config/env";
import Redis from "ioredis";
import type { ZodType } from "zod";

export default class Cache {
  static client = new Redis(env.REDIS_URL);

  static async get<T extends ZodType>(key: string, schema: T) {
    const stored = await this.client.get(key);
    if (!stored) return null;

    const parsed = schema.safeParse(JSON.parse(stored));
    if (!parsed.success) return null;

    return parsed.data;
  }
}
