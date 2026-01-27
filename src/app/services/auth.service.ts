import Cache from "common/utils/cache";
import { UNAUTHORIZED } from "common/utils/errors";
import { nanoid } from "nanoid";
import { HashService } from "./hash.service";

export namespace MagicLinkService {
  export const INTENT_TTL = 5 * 60;
  export const INTENT_KEY = (hash: string) => `auth:intent:${hash}`;

  export async function generate(email: string) {
    const token = nanoid(64);

    await Cache.client.setex(
      INTENT_KEY(HashService.hashToken(token)),
      INTENT_TTL,
      email,
    );

    return token;
  }

  export async function consume(token: string) {
    const key = INTENT_KEY(HashService.hashToken(token));
    const email = await Cache.client.get(key);

    if (!email) throw new UNAUTHORIZED("Invalid or expired magic link");
    await Cache.client.del(key);

    return email;
  }
}
