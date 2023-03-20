import { Database } from "../../prisma";
import { Account } from "../models/Account";
import { ModelManager } from "./ModelManager";

export class AccountModelManager extends ModelManager<Account> {
    GetManagedTable() {
        return Database.account;
    }

    async SetAvatar(item: Account, filename: string, contents: Buffer) {
        if (item.Files.length > 0) {
            let avatar = item.Files[0];

            await this.ReplaceFile(item, avatar, contents);
            await this.updateAvatarHash(item);
            return;
        }

        await this.AddFile(item, filename, contents);
        await this.updateAvatarHash(item);
    }

    private async updateAvatarHash(item: Account) {
        if (item.Files.length > 0) {
            await Database.account.update({
                where: { id: item.id },
                data: {
                    avatar_hash: item.Files[0].hash
                }
            });
        } else {
            await Database.account.update({
                where: { id: item.id },
                data: {
                    avatar_hash: null
                }
            });
        }
    }
}