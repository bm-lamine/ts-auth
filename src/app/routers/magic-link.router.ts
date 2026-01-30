import { MagicLinkModel } from "app/models/magic-link.model";
import { JwtService } from "app/services/jwt.service";
import { MagicLinkService } from "app/services/magic-link.service";
import { UserService } from "app/services/user.service";
import { INTERNAL_SERVER_ERROR } from "common/utils/errors";
import parser from "common/utils/parser";
import { Hono } from "hono";
import { isProd } from "lib/constants";

const magicLinkRouter = new Hono()
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

      if (!user) {
        throw new INTERNAL_SERVER_ERROR();
      }

      return ctx.json({
        tokens: await JwtService.authenticate(user.id),
        message: "user created successfully",
      });
    },
  );

export default magicLinkRouter;
