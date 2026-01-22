import UsersSchema, {
  type CreateUser,
  type User,
} from "app/users/users.schema";
import { db, schema } from "common/db";
import redis from "common/utils/redis";
import { eq } from "drizzle-orm";

export default class UsersService {
  static users_all = "users";
  static user_id = (id: string) => `users:id:${id}`;
  static user_email = (email: string) => `users:email:${email}`;

  static user_ttl = 30 * 60;
  static users_ttl = 2 * 60 * 60;

  static async findByEmail(email: string) {
    const cached = await redis.get(this.user_email(email));
    if (cached) {
      const json = JSON.parse(cached);
      const parsed = await UsersSchema.selectOne.safeParseAsync(json);
      if (parsed.success) return parsed.data;
    }

    const [stored] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email))
      .limit(1);

    if (!stored) return null;

    await redis.setex(
      this.user_email(email),
      this.user_ttl,
      JSON.stringify(stored),
    );

    return stored;
  }

  static async createOne(data: CreateUser) {
    const [created] = await db.insert(schema.users).values(data).returning();
    if (created) this.cacheOne(created);
    return created;
  }

  static async cacheOne(data: User) {
    const toCache = JSON.stringify(data);
    await Promise.all([
      redis.del(this.users_all),
      redis.setex(this.user_email(data.email), this.user_ttl, toCache),
      redis.setex(this.user_id(data.id), this.user_ttl, toCache),
    ]);
  }

  static toJSON(user: User) {
    return { ...user, hash: undefined };
  }
}
