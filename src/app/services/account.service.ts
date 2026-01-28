import {
  AccountModel,
  type TAccount,
  type TInsertAccount,
  type TUpdateAccount,
} from "app/models/account.model";
import { CacheService } from "app/services/cache.service";
import { db, schema } from "common/db";
import { forget } from "common/utils/forget";
import { eq } from "drizzle-orm";

export namespace AccountService {
  export const query = db.select().from(schema.accounts).$dynamic();

  export async function findByUsername(username: string) {
    const key = CacheService.KEYS.ACCOUNT_USERNAME(username);
    const cache = await CacheService.get(key, AccountModel.select);
    if (cache) return cache;

    const [stored] = await query
      .where(eq(schema.accounts.username, username))
      .limit(1);

    return stored ?? null;
  }

  export async function findByUserId(userId: string) {
    const key = CacheService.KEYS.ACCOUNT_USERID(userId);
    const cache = await CacheService.get(key, AccountModel.select);
    if (cache) return cache;

    const [account] = await query
      .where(eq(schema.accounts.userId, userId))
      .limit(1);

    return account ?? null;
  }

  export async function create(data: TInsertAccount) {
    const [account] = await db.insert(schema.accounts).values(data).returning();
    if (account) forget(cacheOne(account));
    return account;
  }

  export async function update(userId: string, data: TUpdateAccount) {
    const [account] = await db
      .update(schema.accounts)
      .set(data)
      .where(eq(schema.accounts.userId, userId))
      .returning();

    if (account) forget(cacheOne(account));
    return account;
  }

  export async function cacheOne(account: TAccount) {
    const json = JSON.stringify(account);
    await CacheService.redis
      .multi()
      .setex(
        CacheService.KEYS.ACCOUNT_USERID(account.userId),
        CacheService.TTLS.ACCOUNT,
        json,
      )
      .setex(
        CacheService.KEYS.ACCOUNT_USERNAME(account.username),
        CacheService.TTLS.ACCOUNT,
        json,
      )
      .del(CacheService.KEYS.ACCOUNTS)
      .exec();
  }

  export function toResponse(account: TAccount) {
    return AccountModel.response.parse(account);
  }
}
