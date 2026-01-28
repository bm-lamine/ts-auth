import requireAuth from "app/middlewares/auth.middleware";
import requirePermission from "app/middlewares/rbac.middleware";
import { AccountModel } from "app/models/account.model";
import { AuthModel, type TPayload } from "app/models/auth.model";
import { MagicLinkModel } from "app/models/magic-link.model";
import { AccountService } from "app/services/account.service";
import { JwtService } from "app/services/jwt.service";
import { MagicLinkService } from "app/services/magic-link.service";
import { UserService } from "app/services/user.service";
import { INTERNAL_SERVER_ERROR, NOT_FOUND } from "common/utils/errors";
import parser from "common/utils/parser";
import { Hono } from "hono";
import type { JwtVariables } from "hono/jwt";
import { isProd } from "lib/constants";
import ErrorFactory from "lib/error-factory";
import { STATUS_CODE } from "lib/status-code";

const router = new Hono();

router.route(
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
        const { token } = ctx.req.valid("query");
        const userAgent = ctx.req.header("User-Agent") ?? "unknown";

        const email = await MagicLinkService.consume({ token, userAgent });
        const user = await UserService.findOrCreate({ email, userAgent });
        if (!user) throw new INTERNAL_SERVER_ERROR();

        return ctx.json({
          tokens: await JwtService.authenticate(user.id),
          message: "user created successfully",
        });
      },
    ),
);

router.route(
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
      requireAuth,
      parser("json", AuthModel.refreshJson),
      async (ctx) => {
        const { refreshToken } = ctx.req.valid("json");
        const { sub } = ctx.get("jwtPayload");
        await JwtService.revoke(sub, refreshToken);
        return ctx.json({ success: true });
      },
    ),
);

router.route(
  "/account",
  new Hono<{ Variables: JwtVariables<TPayload> }>()
    .get("/", requireAuth, async (ctx) => {
      const payload = ctx.get("jwtPayload");

      const account = await AccountService.findByUserId(payload.sub);
      if (!account) throw new NOT_FOUND();

      return ctx.json({
        account: AccountService.toResponse(account),
        message: "account found successfully",
      });
    })
    .post(
      "/",
      requireAuth,
      parser("json", AccountModel.insert.omit({ userId: true })),
      async (ctx) => {
        const json = ctx.req.valid("json");
        const payload = ctx.get("jwtPayload");
        const account = await AccountService.findByUsername(json.username);

        if (account) {
          return ctx.json(
            ErrorFactory.single("username already used", ["username"]),
            STATUS_CODE.UNPROCESSABLE_ENTITY,
          );
        }

        const newAccount = await AccountService.create({
          userId: payload.sub,
          username: json.username,
        });

        if (!newAccount) throw new INTERNAL_SERVER_ERROR();

        return ctx.json({
          account: AccountService.toResponse(newAccount),
          message: "account created successfully",
        });
      },
    )
    .patch(
      "/",
      requireAuth,
      requirePermission("account.update"),
      parser("json", AccountModel.update),
      async (ctx) => {
        const json = ctx.req.valid("json");
        const payload = ctx.get("jwtPayload");

        const account = await AccountService.findByUserId(payload.sub);
        if (!account) {
          return ctx.json(
            ErrorFactory.single("account not found, please create one"),
            STATUS_CODE.NOT_FOUND,
          );
        }

        if (
          json.username &&
          (await AccountService.findByUsername(json.username))
        ) {
          return ctx.json(
            ErrorFactory.single("username already used", ["username"]),
            STATUS_CODE.UNPROCESSABLE_ENTITY,
          );
        }

        const updated = await AccountService.update(payload.sub, json);
        if (!updated) throw new INTERNAL_SERVER_ERROR();

        return ctx.json({
          account: AccountService.toResponse(updated),
          message: "account updated successfully",
        });
      },
    ),
);

export default router;
