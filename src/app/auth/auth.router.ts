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
import {
  refreshJson,
  resendVerification,
  signInJson,
  signUpJson,
  verificationQuery,
} from "./auth.schema";
import {
  authenticate,
  createOtp,
  hashText,
  logout,
  refreshAuth,
  verifyHash,
} from "./auth.service";

const authRouter = new Hono()
  .post("/sign-up", parser("json", signUpJson), async (ctx) => {
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

    const otp = await createOtp({
      email: createdUser.email,
      type: "email-verification",
    });

    console.log(`current otp for ${createdUser.email} is: ${otp}`);

    return ctx.json({
      user: userToJSON(createdUser),
      message: "operation success, user signed up & check your inbox",
    });
  })
  .post("/sign-in", parser("json", signInJson), async (ctx) => {
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

    if (!existingUser.email_verified) {
      const otp = await createOtp({
        email: existingUser.email,
        type: "email-verification",
      });

      console.log(`current otp for ${existingUser.email} is: ${otp}`);
    }

    return ctx.json({
      tokens: await authenticate(existingUser.id),
      user: userToJSON(existingUser),
      note: existingUser.email_verified
        ? "operation success, user singed in"
        : "email not verified, please check yout inbox",
    });
  })
  .post("/refresh", parser("json", refreshJson), async (ctx) => {
    const json = ctx.req.valid("json");
    const { accessToken, refreshToken } = await refreshAuth(json.refreshToken);
    return ctx.json({ accessToken, refreshToken });
  })
  .post("/sign-out", jwtGuard, parser("json", refreshJson), async (ctx) => {
    const json = ctx.req.valid("json");
    const payload = ctx.get("jwtPayload");
    await logout(payload.userId, json.refreshToken);
    return ctx.json({ success: true });
  });

authRouter
  .post("/verify-email", parser("query", verificationQuery), async (ctx) => {
    const query = ctx.req.valid("query");
  })
  .post(
    "/resend-verification",
    parser("query", resendVerification),
    async (ctx) => {},
  );

export default authRouter;
