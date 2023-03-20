import { Router } from "express";
import { Transaction } from "../../src/database/Transaction";
import { ApiRequest } from "../../src/interfaces/ApiRequest";
import { ApiResponse } from "../../src/interfaces/ApiResponse";
import { getAccountById } from "../../src/models/Account";
import { Account as DbAccount } from "@prisma/client";
import { Permissions } from "../../src/utils/Constants";
import { Database } from "../../prisma";
import { DisplayAccount } from "../../src/models/DisplayAccount";
import sharp from "sharp";
import { GlobalSingleton } from "../../src/utils/GlobalSingleton";
import { AccountModelManager } from "../../src/database/AccountModelManager";

const router = Router();

router.get("/@me", async (req: ApiRequest, res: ApiResponse) => {
    if (!req.account)
        return res.status(401).json({
            code: 401,
            message: "You are not authorized to use this endpoint."
        });

    return res.status(200).json({
        code: 200,
        data: req.account
    });
});

/**
 * This is a circumstantial endpoint which changes permissions based on the user's roles and perceived permissions.
 */
router.patch("/:id", async (req: ApiRequest, res: ApiResponse) => {
    if (!req.account)
        return res.status(401).json({
            code: 401,
            message: "You are not authorized to use this endpoint."
        });

    // if (!Util.AssertObjectTypes(req.body, {
    //     username: "string",

    //     // special cases for groups/
    //     groups: {
    //         add: "string[]",
    //         remove: "string[]"
    //     }
    // })) {
    //     return res.status(400).json({
    //         code: 400,
    //         message: "Invalid request body."
    //     });
    // }

    const account = await getAccountById(req.params.id);

    if (!account) {
        return res.status(404).json({
            code: 404,
            message: "The account you are trying to edit does not exist."
        });
    }

    // Assert that the user doesn't have a higher role than the account they're trying to edit.
    // Sort both groups by priority.
    const ownGroups = req.account.groups.sort((a, b) => a.priority - b.priority);
    const accountGroups = account.groups.sort((a, b) => a.priority - b.priority);

    // Assert that the user has a higher role than the account they're trying to edit.
    if (accountGroups.length > 0) {
        if (ownGroups[0].priority <= accountGroups[0].priority && !req.account.hasPermission(Permissions.ADMINISTRATOR)) {
            return res.status(403).json({
                code: 403,
                message: "You are not authorized to edit this account."
            });
        }
    } else {
        if (ownGroups.length === 0 && !req.account.hasPermission(Permissions.ADMINISTRATOR)) {
            return res.status(403).json({
                code: 403,
                message: "You are not authorized to edit this account."
            });
        }
    }

    let changes = [];

    // this has to be done separately from the other fields because it's a special case.
    if (req.body.groups) {
        if (!req.account.hasPermission(Permissions.MANAGE_USER_GROUPS)) {
            return res.status(403).json({
                code: 403,
                message: "You are not authorized to edit this account.",
                required: [
                    "MANAGE_USER_GROUPS"
                ]
            });
        }

        const toAddGroups = await Database.group.findMany({
            where: {
                name: { in: req.body.groups.add ?? [] }
            }
        });

        const toRemoveGroups = await Database.group.findMany({
            where: {
                name: { in: req.body.groups.remove ?? [] }
            }
        });

        const newGroups = account.groups.filter(group => {
            return !toRemoveGroups.find(g => g.id === group.id);
        }).concat(toAddGroups);

        // fitler out duplicates
        const alreadyVisible: string[] = [];
        const filteredGroups = newGroups.filter(group => {
            if (alreadyVisible.includes(group.id)) return false;
            alreadyVisible.push(group.id);
            return true;
        });

        // Check whether the groups have changed.
        if (filteredGroups.length !== account.groups.length) {
            changes.push("groups");
        } else {
            const sortedGroups = filteredGroups.sort((a, b) => a.priority - b.priority);
            const sortedOldGroups = account.groups.sort((a, b) => a.priority - b.priority);

            for (let i = 0; i < sortedGroups.length; i++) {
                if (sortedGroups[i].id !== sortedOldGroups[i].id) {
                    changes.push("groups");
                    break;
                }
            }
        }

        // Update the account if there are changes.
        if (changes.includes("groups")) {
            account.groups = filteredGroups;

            await Database.account.update({
                where: { id: account.id },
                include: { groups: true },
                data: {
                    groups: {
                        set: filteredGroups.map(group => ({
                            id: group.id
                        }))
                    }
                }
            })
        }
    }

    const files = req.files as Express.Multer.File[]

    if (files.find(file => file.fieldname === "avatar")) {
        if (!req.account.hasPermission(Permissions.MANAGE_ACCOUNTS)) {
            return res.status(403).json({
                code: 403,
                message: "You are not authorized to change this account's avatar.",
                required: [
                    "MANAGE_ACCOUNTS"
                ]
            });
        }

        const file = files.find(file => file.fieldname === "avatar")!;

        let extensions = ["png", "jpg", "jpeg", "webp"];
        let extension = file.originalname.split(".").pop();

        if (!extensions.includes(extension!)) {
            return res.status(415).json({
                code: 415,
                message: "The file you uploaded does not match the required file type.",
                data: {
                    allowed: extensions
                }
            });
        }

        let avatarBuffer = await sharp(file.buffer)
            .resize(256, 256)
            .webp({
                quality: 80,
            })
            .toBuffer();
        
        let manager = new AccountModelManager();
        await manager.setAvatar(account, file.originalname, avatarBuffer);

        changes.push("avatar");
    }

    let transaction = new Transaction<DbAccount>();
    let proxy = transaction.startTransaction(account);

    if (req.body.username && req.body.username !== account.username) {
        if (!req.account.hasPermission(Permissions.MANAGE_ACCOUNTS)) {
            return res.status(403).json({
                code: 403,
                message: "You are not authorized to edit this account.",
                required: [
                    "MANAGE_ACCOUNTS"
                ]
            });
        }

        proxy.username = req.body.username;
        proxy.safe_username = req.body.username.replace(" ", "_").toLowerCase();
    }

    let transactionChanges = await transaction.commit("accounts");

    if (transactionChanges.size > 0) {
        let transactionChangesArray = Array.from(transactionChanges.keys());
        changes = changes.concat(transactionChangesArray);
    }

    if (changes.length === 0) {
        return res.status(200).json({
            code: 200,
            message: "No changes were made."
        });
    }

    const newAccount = await getAccountById(account.id);

    return res.status(200).json({
        code: 200,
        data: {
            changes,
            account: new DisplayAccount({
                ...newAccount!,
            })
        }
    })
});

export { router };