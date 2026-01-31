import requireAuth from "app/middlewares/auth.middleware";
import requirePermission from "app/middlewares/rbac.middleware";
import { type TPayload } from "app/models/auth.model";
import { ProfileModel } from "app/models/profile.model";
import { OwnershipService } from "app/services/ownership.service";
import { ProfileService } from "app/services/profile.service";
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

const profileRouter = new Hono<{ Variables: JwtVariables<TPayload> }>()
  .get(
    "/",
    requireAuth,
    requirePermission("profile.read", "self"),
    async (ctx) => {
      const payload = ctx.get("jwtPayload");
      const user = ctx.get("user");

      const profile = await ProfileService.findByUserId(payload.sub);

      if (!profile) {
        throw new NOT_FOUND();
      }

      if (!OwnershipService.self(user, profile)) {
        throw new FORBIDDEN();
      }

      return ctx.json({
        profile: ProfileService.toResponse(profile),
        message: "profile found successfully",
      });
    },
  )
  .post(
    "/",
    requireAuth,
    requirePermission("profile.create"),
    parser("json", ProfileModel.insert.omit({ userId: true })),
    async (ctx) => {
      const json = ctx.req.valid("json");
      const payload = ctx.get("jwtPayload");

      const profile = await ProfileService.findByUsername(json.username);

      if (profile) {
        return ctx.json(
          ErrorFactory.single("username already used", ["username"]),
          STATUS_CODE.UNPROCESSABLE_ENTITY,
        );
      }

      const newprofile = await ProfileService.create({
        userId: payload.sub,
        username: json.username,
      });

      if (!newprofile) {
        throw new INTERNAL_SERVER_ERROR();
      }

      return ctx.json({
        profile: ProfileService.toResponse(newprofile),
        message: "profile created successfully",
      });
    },
  )
  .patch(
    "/",
    requireAuth,
    requirePermission("profile.update", "self"),
    parser("json", ProfileModel.update),
    async (ctx) => {
      const json = ctx.req.valid("json");
      const payload = ctx.get("jwtPayload");
      const user = ctx.get("user");

      const profile = await ProfileService.findByUserId(payload.sub);

      if (!profile) {
        throw new NOT_FOUND();
      }

      if (!OwnershipService.self(user, profile)) {
        throw new FORBIDDEN();
      }

      if (
        json.username &&
        (await ProfileService.findByUsername(json.username))
      ) {
        return ctx.json(
          ErrorFactory.single("username already used", ["username"]),
          STATUS_CODE.UNPROCESSABLE_ENTITY,
        );
      }

      const updated = await ProfileService.update(payload.sub, json);
      if (!updated) {
        throw new INTERNAL_SERVER_ERROR();
      }

      return ctx.json({
        profile: ProfileService.toResponse(updated),
        message: "profile updated successfully",
      });
    },
  );

export default profileRouter;
