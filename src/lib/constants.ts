import { env } from "common/config/env";

export const isProd = env.NODE_ENV === "production";
export const TTL = {
  "5m": 5 * 60,
  "1d": 24 * 60 * 60,
  "7d": 7 * 24 * 60 * 60,
} as const;
