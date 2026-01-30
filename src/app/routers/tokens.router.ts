import requireAuth from "app/middlewares/auth.middleware";
import { AuthModel, type TPayload } from "app/models/auth.model";
import { JwtService } from "app/services/jwt.service";
import parser from "common/utils/parser";
import { Hono } from "hono";
import type { JwtVariables } from "hono/jwt";

const tokensRouter = new Hono<{ Variables: JwtVariables<TPayload> }>()
  .post("/refresh", parser("json", AuthModel.refreshJson), async (ctx) => {
    const { refreshToken: incomingToken } = ctx.req.valid("json");

    const { accessToken, refreshToken } =
      await JwtService.refreshTokens(incomingToken);

    return ctx.json({ accessToken, refreshToken });
  })
  .post(
    "/revoke",
    requireAuth,
    parser("json", AuthModel.refreshJson),
    async (ctx) => {
      const { refreshToken } = ctx.req.valid("json");

      const { sub } = ctx.get("jwtPayload");

      await JwtService.revoke(sub, refreshToken);

      return ctx.json({ success: true });
    },
  );

export default tokensRouter;
