import { Hono } from "hono";
import magicLinkRouter from "./magic-link.router";
import profileRouter from "./profile.router";
import tokensRouter from "./tokens.router";

const router = new Hono();

router
  .route("/magic-link", magicLinkRouter)
  .route("/tokens", tokensRouter)
  .route("/profile", profileRouter);

export default router;
