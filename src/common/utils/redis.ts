import Redis from "ioredis";
import { env } from "src/common/config/env";

const redis = new Redis(env.REDIS_URL);

redis.on("error", (err) => console.log(`[ERROR] ${err}`));

export default redis;
