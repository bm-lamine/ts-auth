import { env } from "common/config/env";
import { jwt } from "hono/jwt";

export default jwt({ secret: env.JWT_SECRET });
