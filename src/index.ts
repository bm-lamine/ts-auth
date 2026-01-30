import authRouter from "app/routers/auth.router";
import { env } from "common/config/env";
import { Hono } from "hono";
import { showRoutes } from "hono/dev";
import { etag } from "hono/etag";
import { logger } from "hono/logger";

const app = new Hono()
  .basePath("/api")
  .use(logger(), etag())
  .route("/auth", authRouter);

showRoutes(app);

export default {
  fetch: app.fetch,
  port: env.PORT,
};
