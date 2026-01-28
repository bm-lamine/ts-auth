import {
  UserModel,
  type TAuthUser,
  type TUserRules,
} from "app/models/user.model";
import { db, schema } from "common/db";
import { CacheService } from "app/services/cache.service";
import { forget } from "common/utils/forget";
import { eq } from "drizzle-orm";

export namespace RBAC {
  export async function getDbPermissions(userId: string) {
    const rows = await db
      .select({
        rule: schema.permissions.rule,
        isSuperAdmin: schema.roles.isSuperAdmin,
      })
      .from(schema.usersRoles)
      .innerJoin(
        schema.roles,
        eq(schema.rolesPermission.roleId, schema.roles.id),
      )
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
      rules: rows.map((r) => r.rule).filter(Boolean),
    };
  }

  export async function getCachedPermissions(userId: string) {
    const key = CacheService.KEYS.USER_PERMISSIONS(userId);
    return await CacheService.get(key, UserModel.rules);
  }

  export async function getPermissions(userId: string) {
    const cached = await getCachedPermissions(userId);
    if (cached) return cached;

    const fresh = await getDbPermissions(userId);
    cachePermissions(userId, fresh);
    return fresh;
  }

  export function cachePermissions(userId: string, data: TUserRules) {
    forget(
      CacheService.redis.setex(
        CacheService.KEYS.USER_PERMISSIONS(userId),
        CacheService.TTLS.USER_PERMISSIONS,
        JSON.stringify(data),
      ),
    );
  }

  export function can(user: TAuthUser, permission: string) {
    if (user.isSuperAdmin) return true;
    return user.permissions.includes(permission);
  }
}
