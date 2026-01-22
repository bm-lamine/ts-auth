import { env } from "common/config/env";
import Redis from "ioredis";

const redis = new Redis(env.REDIS_URL);

redis.on("error", (err) => console.log(`[ERROR] ${err}`));

export default redis;
