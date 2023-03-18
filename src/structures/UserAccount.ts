import { Account, Group } from "@prisma/client";

export type DeeperAccount = Account & {
    groups: Group[];
}

export class UserAccount {
    data: DeeperAccount;

    constructor(data: DeeperAccount) {
        this.data = data;
    }
}