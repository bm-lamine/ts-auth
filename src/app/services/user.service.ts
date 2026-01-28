import { UserModel, type TInsertUser, type TUser } from "app/models/user.model";
import { db, schema } from "common/db";
import { Cache } from "common/utils/cache";
import { forget } from "common/utils/forget";
import { eq } from "drizzle-orm";
import { TTL } from "lib/constants";

export namespace UserService {
  export const KEYS = {
    USERS: "auth:users",
    USER_EMAIL: (email: string) => `auth:user:email:${email}`,
    USER_ID: (id: string) => `auth:user:id:${id}`,
  } as const;

  export const TTLS = {
    USER: TTL["5m"],
    USERS: TTL["7d"],
  } as const;

  export async function findByEmail(email: string) {
    const key = KEYS.USER_EMAIL(email);
    const cache = await Cache.get(key, UserModel.select);
    if (cache) return cache;

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

    forget(cacheOne(user));
    return user;
  }

  export async function cacheOne(user: TUser) {
    const json = JSON.stringify(user);
    await Cache.redis
      .multi()
      .setex(KEYS.USER_ID(user.id), TTLS.USER, json)
      .setex(KEYS.USER_EMAIL(user.email), TTLS.USER, json)
      .del(KEYS.USERS)
      .exec();
  }
}
