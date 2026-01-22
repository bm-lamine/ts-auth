import { zValidator } from "@hono/zod-validator";
import type { ValidationTargets } from "hono";
import ErrorFactory from "lib/error-factory";
import { STATUS_CODE } from "lib/status-code";
import type { ZodType } from "zod";

export default function parser<
  T extends ZodType,
  Target extends keyof ValidationTargets,
>(target: Target, schema: T) {
  return zValidator(target, schema, (result, ctx) => {
    if (!result.success) {
      return ctx.json(
        ErrorFactory.from(
          result.error.issues.map((i) => ({
            path: i.path,
            message: i.message,
          })),
        ).toJSON(),
        STATUS_CODE.UNPROCESSABLE_ENTITY,
      );
    }
  });
}
