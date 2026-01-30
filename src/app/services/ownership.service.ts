import type { TAuthUser } from "app/models/user.model";

export namespace OwnershipService {
  export const self = <T extends THasUserId>(user: TAuthUser, resource: T) =>
    user.id === resource.userId;
}

export type THasUserId = { userId: string };
