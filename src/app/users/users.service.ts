import { db, schema } from "common/db";
import redis from "common/utils/redis";
import { eq } from "drizzle-orm";
import {
  selectUserSchema,
  userJsonSchema,
  type CreateUserSchema,
  type UpdateUserSchema,
  type User,
} from "./users.schema";

export const USERS_KEY = "users";
export const USER_TTL = 30 * 60;
export const USERS_TTL = 2 * 60 * 60;
export const USER_ID = (id: string) => `users:id:${id}`;
export const USER_EMAIL = (email: string) => `users:email:${email}`;

export async function findUserByEmail(email: string) {
  const cached = await redis.get(USER_EMAIL(email));
  if (cached) {
    const json = JSON.parse(cached);
    const parsed = await selectUserSchema.safeParseAsync(json);
    if (parsed.success) return parsed.data;
  }

  const [stored] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, email))
    .limit(1);

  if (!stored) return null;

  await redis.setex(USER_EMAIL(email), USER_TTL, JSON.stringify(stored));

  return stored;
}

export async function createUser(data: CreateUserSchema) {
  const [created] = await db.insert(schema.users).values(data).returning();
  if (created) cacheUser(created);
  return created;
}

export async function updateUser(userId: string, data: UpdateUserSchema) {
  const [updated] = await db
    .update(schema.users)
    .set(data)
    .where(eq(schema.users.id, userId))
    .returning();
  if (updated) cacheUser(updated);
  return updated;
}

export async function invalidateCache(user: User) {
  await Promise.all([
    redis.del(USERS_KEY),
    redis.del(USER_EMAIL(user.email)),
    redis.del(USER_ID(user.id)),
  ]);
}

export async function cacheUser(data: User) {
  const toCache = JSON.stringify(data);
  await Promise.all([
    redis.del(USERS_KEY),
    redis.setex(USER_EMAIL(data.email), USER_TTL, toCache),
    redis.setex(USER_ID(data.id), USER_TTL, toCache),
  ]);
}

export function userToJSON(user: User) {
  const parsed = userJsonSchema.parse(user);
  return parsed;
}
