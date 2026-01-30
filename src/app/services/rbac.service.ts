import {
  PermissionModel,
  type TPermissionCache,
  type TPermissionScope,
} from "app/models/permission.model";
import { UserModel, type TAuthUser, type TRole } from "app/models/user.model";
import { CacheService } from "app/services/cache.service";
import { db, schema } from "common/db";
import { forget } from "common/utils/forget";
import { eq } from "drizzle-orm";

export namespace RBAC {
  export async function getDbPermissions(userId: string): Promise<{
    isSuperAdmin: boolean;
    permissions: Array<TPermissionCache>;
  }> {
    const rows = await db
      .select({
        isSuperAdmin: schema.roles.isSuperAdmin,
        permission: {
          rule: schema.permissions.rule,
          scope: schema.permissions.scope,
        },
      })
      .from(schema.usersRoles)
      .innerJoin(schema.roles, eq(schema.usersRoles.roleId, schema.roles.id))
      .leftJoin(
        schema.rolesPermission,
        eq(schema.roles.id, schema.rolesPermission.roleId),
      )
      .leftJoin(
        schema.permissions,
        eq(schema.rolesPermission.permissionId, schema.permissions.id),
      )
      .where(eq(schema.usersRoles.userId, userId));

    return {
      isSuperAdmin: rows.some((r) => r.isSuperAdmin),
      permissions: rows.map((r) => r.permission).filter((p) => p !== null),
    };
  }

  export async function getCachedPermissions(userId: string) {
    const key = CacheService.KEYS.USER_PERMISSIONS(userId);
    return await CacheService.get(key, UserModel.role);
  }

  export async function getPermissions(userId: string) {
    const cached = await getCachedPermissions(userId);
    if (cached) return cached;

    const fresh = await getDbPermissions(userId);
    cachePermissions(userId, fresh);
    return fresh;
  }

  export function cachePermissions(userId: string, data: TRole) {
    forget(
      CacheService.redis.setex(
        CacheService.KEYS.USER_PERMISSIONS(userId),
        CacheService.TTLS.USER_PERMISSIONS,
        JSON.stringify(data),
      ),
    );
  }

  export function can(
    user: TAuthUser,
    rule: string,
    scope: TPermissionScope = "global",
  ) {
    if (user.isSuperAdmin) return true;
    const requiredLevel = PermissionModel.scopeLevel[scope];
    return user.permissions.some((p) => {
      if (p.rule !== rule) return false;
      return PermissionModel.scopeLevel[p.scope] >= requiredLevel;
    });
  }
}
