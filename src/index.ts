import { Hono } from "hono";
import { env } from "src/common/config/env";

const app = new Hono();

export default {
  fetch: app.fetch,
  port: env.PORT,
};
