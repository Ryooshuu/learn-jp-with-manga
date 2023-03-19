import { Account as DbAccount, Group } from "@prisma/client";
import { IHasGuidId } from "../database/IHasGuidId";

type DeeperAccount = DbAccount & {
    groups: Group[];
}

export class DisplayAccount implements IHasGuidId {
    id: string;
    username: string;
    safe_username: string;
    created_at: Date;
    updated_at: Date;
    avatar_hash: string | null;
    country_code: string;
    permissions_grant: number;
    permissions_revoke: number;
    flags: number;
    groups: Group[];

    constructor(data: DeeperAccount) {
        this.id = data.id;
        this.username = data.username;
        this.safe_username = data.safe_username;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
        this.avatar_hash = data.avatar_hash;
        this.country_code = data.country_code;
        this.permissions_grant = data.permissions_grant;
        this.permissions_revoke = data.permissions_revoke;
        this.flags = data.flags;
        this.groups = data.groups;
    }
}