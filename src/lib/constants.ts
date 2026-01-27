import { env } from "common/config/env";

export const isProd = env.NODE_ENV === "production";
