import type { TPayload } from "app/models/auth.model";
import type { TPermissionScope } from "app/models/permission.model";
import type { TAuthUser } from "app/models/user.model";
import { RBAC } from "app/services/rbac.service";
import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import type { JwtVariables } from "hono/jwt";
import { STATUS_CODE } from "lib/status-code";

const requirePermission = (rule: string, scope?: TPermissionScope) =>
  createMiddleware<{ Variables: JwtVariables<TPayload> & { user: TAuthUser } }>(
    async function (ctx, next) {
      const { sub: userId } = ctx.get("jwtPayload");
      const permissions = await RBAC.getPermissions(userId);

      if (!RBAC.can({ id: userId, ...permissions }, rule, scope)) {
        throw new HTTPException(STATUS_CODE.FORBIDDEN, {
          message: "insufficient permissions",
        });
      }

      ctx.set("user", { id: userId, ...permissions });
      return next();
    },
  );

export default requirePermission;
