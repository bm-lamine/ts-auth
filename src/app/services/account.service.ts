import {
  AccountModel,
  type TAccount,
  type TInsertAccount,
  type TUpdateAccount,
} from "app/models/account.model";
import { db, schema } from "common/db";
import { Cache } from "common/utils/cache";
import { forget } from "common/utils/forget";
import { eq } from "drizzle-orm";
import { TTL } from "lib/constants";
export namespace AccountService {
  export const KEYS = {
    ACCOUNTS: "auth:accounts",
    ACCOUNT_USERNAME: (username: string) => `auth:account:username:${username}`,
    ACCOUNT_USERID: (userId: string) => `auth:account:userId:${userId}`,
  } as const;

  export const TTLS = {
    ACCOUNT: TTL["5m"],
    ACCOUNTS: TTL["7d"],
  } as const;

  export const query = db.select().from(schema.accounts).$dynamic();

  export async function findByUsername(username: string) {
    const key = KEYS.ACCOUNT_USERNAME(username);
    const cache = await Cache.get(key, AccountModel.select);
    if (cache) return cache;

    const [stored] = await query
      .where(eq(schema.accounts.username, username))
      .limit(1);

    return stored ?? null;
  }

  export async function findByUserId(userId: string) {
    const key = KEYS.ACCOUNT_USERID(userId);
    const cache = await Cache.get(key, AccountModel.select);
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
    await Cache.redis
      .multi()
      .setex(KEYS.ACCOUNT_USERID(account.userId), TTLS.ACCOUNT, json)
      .setex(KEYS.ACCOUNT_USERNAME(account.username), TTLS.ACCOUNT, json)
      .del(KEYS.ACCOUNTS)
      .exec();
  }

  export function toResponse(account: TAccount) {
    return AccountModel.response.parse(account);
  }
}
