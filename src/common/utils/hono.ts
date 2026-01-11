import { zValidator } from "@hono/zod-validator";
import { Hono, type ValidationTargets } from "hono";
import type { JwtVariables } from "hono/jwt";
import ErrorFactory from "src/lib/error-factory";
import { STATUS_CODE } from "src/lib/status-code";
import type { ZodType } from "zod";

export const createRouter = () =>
  new Hono<{ Variables: JwtVariables<JwtPayload> }>();

export const parser = function <
  T extends ZodType,
  Target extends keyof ValidationTargets
>(target: Target, schema: T) {
  return zValidator(target, schema, (result, ctx) => {
    if (!result.success) {
      const factory = ErrorFactory.from(
        result.error.issues.map((i) => ({
          path: i.path,
          message: i.message,
          code: i.code,
        })),
        STATUS_CODE.UNPROCESSABLE_ENTITY
      );

      return ctx.json(factory.toJSON(), factory.status);
    }
  });
};

export type JwtPayload = {
  sid: string;
  sub: string; // userId
};
