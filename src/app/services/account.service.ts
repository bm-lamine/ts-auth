import {
  AccountModel,
  type TAccount,
  type TInsertAccount,
  type TUpdateAccount,
} from "app/models/account.model";
import { db, schema } from "common/db";
import { INTERNAL_SERVER_ERROR } from "common/utils/errors";
import { eq } from "drizzle-orm";

export namespace AccountService {
  export const query = db.select().from(schema.accounts).$dynamic();

  export async function findByUsername(username: string) {
    const [account] = await query
      .where(eq(schema.accounts.username, username))
      .limit(1);
    return account ?? null;
  }

  export async function findByUserId(userId: string) {
    const [account] = await query
      .where(eq(schema.accounts.userId, userId))
      .limit(1);
    return account ?? null;
  }

  export async function create(data: TInsertAccount) {
    const [account] = await db.insert(schema.accounts).values(data).returning();
    if (!account) throw new INTERNAL_SERVER_ERROR();
    return account;
  }

  export async function update(userId: string, data: TUpdateAccount) {
    const [account] = await db
      .update(schema.accounts)
      .set(data)
      .where(eq(schema.accounts.userId, userId))
      .returning();
    if (!account) throw new INTERNAL_SERVER_ERROR();
    return account;
  }

  export function toResponse(account: TAccount) {
    return AccountModel.response.parse(account);
  }
}
