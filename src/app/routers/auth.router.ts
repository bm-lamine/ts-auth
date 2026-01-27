import { AuthModel } from "app/models/auth.model";
import { MagicLinkService } from "app/services/auth.service";
import { UserService } from "app/services/user.service";
import { env } from "common/config/env";
import parser from "common/utils/parser";
import { Hono } from "hono";

const isProd = env.NODE_ENV === "production";
const authRouter = new Hono();

authRouter.route(
  "/magic-link",
  new Hono()
    .post("/intent", parser("json", AuthModel.intentJson), async (ctx) => {
      const json = ctx.req.valid("json");
      const token = await MagicLinkService.generate(json.email);

      return ctx.json({
        message: isProd
          ? "your email was registered, please check your inbox"
          : `your token is ${token}`,
      });
    })
    .post(
      "/callback",
      parser("query", AuthModel.callbackQuery),
      async (ctx) => {
        const query = ctx.req.valid("query");
        const email = await MagicLinkService.consume(query.token);
        const user = await UserService.findOrCreate({ email });

        return ctx.json({
          user: UserService.toJSON(user),
          message: "user created successfully",
        });
      },
    ),
);

export default authRouter;
