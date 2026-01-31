import {
  ProfileModel,
  type TInsertProfile,
  type TProfile,
  type TUpdateProfile,
} from "app/models/profile.model";
import { CacheService } from "app/services/cache.service";
import { db, schema } from "common/db";
import { forget } from "common/utils/forget";
import { eq } from "drizzle-orm";

export namespace ProfileService {
  export const query = db.select().from(schema.profiles).$dynamic();

  export async function findByUsername(username: string) {
    const key = CacheService.KEYS.PROFILE_USERNAME(username);
    const cache = await CacheService.get(key, ProfileModel.select);
    if (cache) return cache;

    const [stored] = await query
      .where(eq(schema.profiles.username, username))
      .limit(1);

    return stored ?? null;
  }

  export async function findByUserId(userId: string) {
    const key = CacheService.KEYS.PROFILE_USERID(userId);
    const cache = await CacheService.get(key, ProfileModel.select);
    if (cache) return cache;

    const [stored] = await query
      .where(eq(schema.profiles.userId, userId))
      .limit(1);

    return stored ?? null;
  }

  export async function create(data: TInsertProfile) {
    const [created] = await db.insert(schema.profiles).values(data).returning();
    if (created) forget(cacheOne(created));
    return created;
  }

  export async function update(userId: string, data: TUpdateProfile) {
    const [updated] = await db
      .update(schema.profiles)
      .set(data)
      .where(eq(schema.profiles.userId, userId))
      .returning();

    if (updated) forget(cacheOne(updated));
    return updated;
  }

  export async function cacheOne(profile: TProfile) {
    const json = JSON.stringify(profile);
    await CacheService.redis
      .multi()
      .setex(
        CacheService.KEYS.PROFILE_USERID(profile.userId),
        CacheService.TTLS.PROFILE,
        json,
      )
      .setex(
        CacheService.KEYS.PROFILE_USERNAME(profile.username),
        CacheService.TTLS.PROFILE,
        json,
      )
      .del(CacheService.KEYS.PROFILES)
      .exec();
  }

  export function toResponse(profile: TProfile) {
    return ProfileModel.response.parse(profile);
  }
}
