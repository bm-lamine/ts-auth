import {
  createUser,
  findUserByEmail,
  userToJSON,
} from "app/users/users.service";
import parser from "common/utils/parser";
import { Hono } from "hono";
import ErrorFactory from "lib/error-factory";
import { STATUS_CODE } from "lib/status-code";
import { jwtGuard } from "./auth.guard";
import { refreshSchema, signInSchema, signUpSchema } from "./auth.schema";
import {
  authenticate,
  hashText,
  logout,
  refreshAuth,
  verifyHash,
} from "./auth.service";

const authRouter = new Hono()
  .post("/sign-up", parser("json", signUpSchema), async (ctx) => {
    const json = ctx.req.valid("json");
    const existingUser = await findUserByEmail(json.email);

    if (existingUser) {
      return ctx.json(
        ErrorFactory.single("email already used", ["email"]),
        STATUS_CODE.UNPROCESSABLE_ENTITY,
      );
    }

    const createdUser = await createUser({
      email: json.email,
      hash: await hashText(json.password),
    });

    if (!createdUser) {
      return ctx.json(
        ErrorFactory.single("operation fail"),
        STATUS_CODE.INTERNAL_SERVER_ERROR,
      );
    }

    return ctx.json({
      user: userToJSON(createdUser),
      message: "operation success, user signed up",
    });
  })
  .post("/sign-in", parser("json", signInSchema), async (ctx) => {
    const json = ctx.req.valid("json");
    const existingUser = await findUserByEmail(json.email);

    const conditions =
      !existingUser || !(await verifyHash(json.password, existingUser.hash));

    if (conditions) {
      return ctx.json(
        ErrorFactory.single("email not found in records", ["email"]),
        STATUS_CODE.UNPROCESSABLE_ENTITY,
      );
    }

    return ctx.json({
      tokens: await authenticate(existingUser.id),
      user: userToJSON(existingUser),
      message: "operation success, user singed in",
    });
  })
  .post("/refresh", parser("json", refreshSchema), async (ctx) => {
    const json = ctx.req.valid("json");
    const { accessToken, refreshToken } = await refreshAuth(json.refreshToken);
    return ctx.json({ accessToken, refreshToken });
  })
  .post("/sign-out", jwtGuard, parser("json", refreshSchema), async (ctx) => {
    const json = ctx.req.valid("json");
    const payload = ctx.get("jwtPayload");
    await logout(payload.userId, json.refreshToken);
    return ctx.json({ success: true });
  });

export default authRouter;
