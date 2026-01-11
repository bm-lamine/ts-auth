import { pgSchema } from "drizzle-orm/pg-core";

export const auth = pgSchema("auth");

export const users = auth.table("users", (c) => ({}));
