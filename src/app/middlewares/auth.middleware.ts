import { env } from "common/config/env";
import { jwt } from "hono/jwt";

const requireAuth = jwt({ secret: env.JWT_SECRET });

export default requireAuth;
