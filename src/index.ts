import { env } from "common/config/env";
import { Hono } from "hono";
import { etag } from "hono/etag";
import { logger } from "hono/logger";

const app = new Hono()
  .basePath("/api")
  .use(logger(), etag())
  .route("/auth", new Hono());

export default {
  fetch: app.fetch,
  port: env.PORT,
};
