import { env } from "common/config/env";
import { jwt } from "hono/jwt";

export const jwtGuard = jwt({ secret: env.JWT_SECRET });
