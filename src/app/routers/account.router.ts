import requireAuth from "app/middlewares/auth.middleware";
import requirePermission from "app/middlewares/rbac.middleware";
import { AccountModel } from "app/models/account.model";
import { type TPayload } from "app/models/auth.model";
import { AccountService } from "app/services/account.service";
import { OwnershipService } from "app/services/ownership.service";
import {
  FORBIDDEN,
  INTERNAL_SERVER_ERROR,
  NOT_FOUND,
} from "common/utils/errors";
import parser from "common/utils/parser";
import { Hono } from "hono";
import { type JwtVariables } from "hono/jwt";
import ErrorFactory from "lib/error-factory";
import { STATUS_CODE } from "lib/status-code";

const accountRouter = new Hono<{ Variables: JwtVariables<TPayload> }>()
  .get(
    "/me",
    requireAuth,
    requirePermission("account.read", "self"),
    async (ctx) => {
      const payload = ctx.get("jwtPayload");
      const user = ctx.get("user");

      const account = await AccountService.findByUserId(payload.sub);

      if (!account) {
        throw new NOT_FOUND();
      }

      if (!OwnershipService.self(user, account)) {
        throw new FORBIDDEN();
      }

      return ctx.json({
        account: AccountService.toResponse(account),
        message: "account found successfully",
      });
    },
  )
  .post(
    "/me",
    requireAuth,
    requirePermission("account.create"),
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

      if (!newAccount) {
        throw new INTERNAL_SERVER_ERROR();
      }

      return ctx.json({
        account: AccountService.toResponse(newAccount),
        message: "account created successfully",
      });
    },
  )
  .patch(
    "/me",
    requireAuth,
    requirePermission("account.update", "self"),
    parser("json", AccountModel.update),
    async (ctx) => {
      const json = ctx.req.valid("json");
      const payload = ctx.get("jwtPayload");
      const user = ctx.get("user");

      const account = await AccountService.findByUserId(payload.sub);

      if (!account) {
        throw new NOT_FOUND();
      }

      if (!OwnershipService.self(user, account)) {
        throw new FORBIDDEN();
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
      if (!updated) {
        throw new INTERNAL_SERVER_ERROR();
      }

      return ctx.json({
        account: AccountService.toResponse(updated),
        message: "account updated successfully",
      });
    },
  );

export default accountRouter;
