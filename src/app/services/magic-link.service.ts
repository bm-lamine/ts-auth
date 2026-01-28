import {
  MagicLinkModel,
  type TMagicLinkConsumeOptions,
  type TMagicLinkOptions,
  type TMagicLinkPayload,
} from "app/models/magic-link.model";
import { Cache } from "common/utils/cache";
import { UNAUTHORIZED } from "common/utils/errors";
import { TTL } from "lib/constants";
import { nanoid } from "nanoid";
import { HashService } from "./hash.service";

export namespace MagicLinkService {
  export const INTENT_TTL = TTL["5m"];
  export const INTENT_KEY = (hash: string) => `auth:intent:${hash}`;

  export async function generate({
    email,
    userAgent,
    ipAddress,
  }: TMagicLinkOptions): Promise<string> {
    const token = nanoid(128);

    const json = JSON.stringify({
      email,
      uaHash: HashService.hashUA(userAgent),
      ipHash: ipAddress ? HashService.hashIP(ipAddress) : undefined,
    } satisfies TMagicLinkPayload);

    await Cache.redis.setex(
      INTENT_KEY(HashService.hashToken(token)),
      INTENT_TTL,
      json,
    );

    return token;
  }

  export async function consume({
    token,
    userAgent,
    ipAddress,
  }: TMagicLinkConsumeOptions): Promise<string> {
    const key = INTENT_KEY(HashService.hashToken(token));

    const raw = await Cache.redis.getdel(key);
    if (!raw) {
      throw new UNAUTHORIZED("Invalid or expired magic link");
    }

    const parsed = MagicLinkModel.payload.safeParse(JSON.parse(raw));
    if (!parsed.success) {
      throw new UNAUTHORIZED("Invalid payload");
    }

    if (parsed.data.uaHash !== HashService.hashUA(userAgent)) {
      throw new UNAUTHORIZED("Magic link context mismatch");
    }

    if (parsed.data.ipHash && ipAddress) {
      if (parsed.data.ipHash !== HashService.hashIP(ipAddress)) {
        throw new UNAUTHORIZED("Magic link context mismatch");
      }
    }

    return parsed.data.email;
  }
}
