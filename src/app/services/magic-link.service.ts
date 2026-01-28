import {
  MagicLinkModel,
  type TMagicLinkConsumeOptions,
  type TMagicLinkOptions,
  type TMagicLinkPayload,
} from "app/models/magic-link.model";
import { CacheService } from "app/services/cache.service";
import { UNAUTHORIZED } from "common/utils/errors";
import { nanoid } from "nanoid";
import { HashService } from "./hash.service";

export namespace MagicLinkService {
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

    await CacheService.redis.setex(
      CacheService.KEYS.INTENT_HASH(HashService.hashToken(token)),
      CacheService.TTLS.INTENT_HASH,
      json,
    );

    return token;
  }

  export async function consume({
    token,
    userAgent,
    ipAddress,
  }: TMagicLinkConsumeOptions): Promise<string> {
    const key = CacheService.KEYS.INTENT_HASH(HashService.hashToken(token));
    const raw = await CacheService.redis.getdel(key);

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
