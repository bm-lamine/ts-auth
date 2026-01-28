import { UserModel, type TInsertUser, type TUser } from "app/models/user.model";
import { CacheService } from "app/services/cache.service";
import { db, schema } from "common/db";
import { forget } from "common/utils/forget";
import { eq } from "drizzle-orm";

export namespace UserService {
  export async function findByEmail(email: string) {
    const key = CacheService.KEYS.USER_EMAIL(email);
    const cached = await CacheService.get(key, UserModel.select);
    if (cached) return cached;

    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email))
      .limit(1);

    return user ?? null;
  }

  export async function create(values: TInsertUser) {
    const [user] = await db.insert(schema.users).values(values).returning();
    return user;
  }

  export async function findOrCreate(
    values: TInsertUser,
  ): Promise<TUser | null> {
    const found = await findByEmail(values.email);
    if (found) return found;

    const user = await create(values);
    if (!user) return null;

    forget(CacheServiceOne(user));
    return user;
  }

  export async function CacheServiceOne(user: TUser) {
    const json = JSON.stringify(user);
    await CacheService.redis
      .multi()
      .setex(CacheService.KEYS.USER_ID(user.id), CacheService.TTLS.USER, json)
      .setex(
        CacheService.KEYS.USER_EMAIL(user.email),
        CacheService.TTLS.USER,
        json,
      )
      .del(CacheService.KEYS.USERS)
      .exec();
  }
}
