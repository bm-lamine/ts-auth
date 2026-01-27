import jwtMiddleware from "app/middlewares/jwt.middleware";
import { AuthModel, type TPayload } from "app/models/auth.model";
import { MagicLinkModel } from "app/models/magic-link.model";
import { JwtService } from "app/services/jwt.service";
import { MagicLinkService } from "app/services/magic-link.service";
import { UserService } from "app/services/user.service";
import { env } from "common/config/env";
import parser from "common/utils/parser";
import { Hono } from "hono";
import type { JwtVariables } from "hono/jwt";

const authRouter = new Hono();
const isProd = env.NODE_ENV === "production";

authRouter.route(
  "/magic-link",
  new Hono()
    .post("/intent", parser("json", MagicLinkModel.intentJson), async (ctx) => {
      const json = ctx.req.valid("json");
      const token = await MagicLinkService.generate({
        email: json.email,
        userAgent: ctx.req.header("User-Agent") ?? "unknown",
      });

      return ctx.json({
        message: isProd
          ? "your email was registered, please check your inbox"
          : `your token is ${token}`,
      });
    })
    .post(
      "/callback",
      parser("query", MagicLinkModel.callbackQuery),
      async (ctx) => {
        const query = ctx.req.valid("query");
        const email = await MagicLinkService.consume({
          token: query.token,
          userAgent: ctx.req.header("User-Agent") ?? "unknown",
        });

        const user = await UserService.findOrCreate({ email });

        return ctx.json({
          user: UserService.toJSON(user),
          tokens: await JwtService.authenticate(user.id),
          message: "user created successfully",
        });
      },
    ),
);

authRouter.route(
  "/tokens",
  new Hono<{ Variables: JwtVariables<TPayload> }>()
    .post("/refresh", parser("json", AuthModel.refreshJson), async (ctx) => {
      const { refreshToken: incomingToken } = ctx.req.valid("json");
      const { accessToken, refreshToken } =
        await JwtService.refreshTokens(incomingToken);
      return ctx.json({ accessToken, refreshToken });
    })
    .post(
      "/revoke",
      jwtMiddleware,
      parser("json", AuthModel.refreshJson),
      async (ctx) => {
        const { refreshToken } = ctx.req.valid("json");
        const { sub } = ctx.get("jwtPayload");
        await JwtService.revoke(sub, refreshToken);
        return ctx.json({ success: true });
      },
    ),
);

export default authRouter;
