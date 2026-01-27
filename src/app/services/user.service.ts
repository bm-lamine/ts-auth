import { type TInsertUser } from "app/models/user.model";
import { db, schema } from "common/db";
import { INTERNAL_SERVER_ERROR } from "common/utils/errors";

export namespace UserService {
  export const query = db.select().from(schema.users).$dynamic();

  export async function findOrCreate(values: TInsertUser) {
    const [user] = await db
      .insert(schema.users)
      .values(values)
      .onConflictDoUpdate({ target: schema.users.email, set: values })
      .returning();

    if (!user) throw new INTERNAL_SERVER_ERROR();
    return user;
  }
}
