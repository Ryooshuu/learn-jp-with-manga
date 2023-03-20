import { Account as DbAccount, Group } from "@prisma/client";
import { Database } from "../../prisma";
import { IHasFiles } from "../database/IHasFiles";
import { IHasGuidId } from "../database/IHasGuidId";
import { GetFileInDatabase } from "../database/ModelManager";
import { Permissions } from "../utils/Constants";
import { File } from "./File";

type DeeperAccount = DbAccount & {
    groups: Group[];
}

export class Account implements DeeperAccount, IHasGuidId, IHasFiles {
    id: string;
    username: string;
    safe_username: string;
    email: string;
    password: string;
    created_at: Date;
    updated_at: Date;
    avatar_hash: string | null;
    country_code: string;
    permissions_grant: number;
    permissions_revoke: number;
    flags: number;
    groups: Group[];

    Files: File[] = [];
    Hash: string = "";

    constructor(data: DeeperAccount) {
        this.id = data.id;
        this.username = data.username;
        this.safe_username = data.safe_username;
        this.email = data.email;
        this.password = data.password;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
        this.avatar_hash = data.avatar_hash;
        this.country_code = data.country_code;
        this.permissions_grant = data.permissions_grant;
        this.permissions_revoke = data.permissions_revoke;
        this.flags = data.flags;
        this.groups = data.groups;
    }
    
    async LoadFiles(): Promise<void> {
        if (this.Files.length > 0)
            return;

        if (this.avatar_hash) {
            let file = await GetFileInDatabase(this.avatar_hash);

            if (file)
                this.Files.push(file);
        }
    }

    get avatar(): File | null {
        if (this.Files.length > 0)
            return this.Files[0];

        return null;
    }

    HasPermission(permission: number): boolean {
        const adminGroup = this.groups.find(g => g.permissions_grant & Permissions.ADMINISTRATOR);

        if (adminGroup)
            return true;

        return (this.groups.reduce((a, b) => a | b.permissions_grant, 0)
            & this.groups.reduce((a, b) => a & ~b.permissions_revoke, 0)) == permission;
    }
}

export async function GetAccountById(id: string): Promise<Account | null> {
    let account = await Database.account.findFirst({ where: { id: id } });

    if (!account)
        return null;

    let groups = await Database.group.findMany({ where: { accounts: { some: { id: id } } } });
    let model = new Account({
        ...account,
        groups: groups
    });

    await model.LoadFiles();
    return model;
}