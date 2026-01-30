import { Hono } from "hono";
import accountRouter from "./account.router";
import magicLinkRouter from "./magic-link.router";
import tokensRouter from "./tokens.router";

const router = new Hono();

router
  .route("/magic-link", magicLinkRouter)
  .route("/tokens", tokensRouter)
  .route("/account", accountRouter);

export default router;
