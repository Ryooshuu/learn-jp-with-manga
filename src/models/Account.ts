import { Account as DbAccount } from "@prisma/client";
import { Database } from "../../prisma";
import { IHasFiles } from "../database/IHasFiles";
import { IHasGuidId } from "../database/IHasGuidId";
import { GetFileInDatabase } from "../database/ModelManager";
import { File } from "./File";

export class Account implements DbAccount, IHasGuidId, IHasFiles {
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

    Files: File[] = [];
    Hash: string = "";

    constructor(data: DbAccount) {
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
    }
    
    async loadFiles(): Promise<void> {
        if (this.Files.length > 0)
            return;

        if (this.avatar_hash) {
            let file = await GetFileInDatabase(this.avatar_hash);

            if (file)
                this.Files.push(file);
        }
    }

    getAvatar(): File | null {
        if (this.Files.length > 0)
            return this.Files[0];

        return null;
    }
}

export async function GetAccountById(id: string): Promise<Account | null> {
    let account = await Database.account.findFirst({ where: { id: id } });

    if (!account)
        return null;

    return new Account(account);
}