import argon2 from "argon2";
import { Prisma } from "@prisma/client";
import { Router } from "express";
import { Database } from "../../prisma";
import { ApiRequest } from "../../src/interfaces/ApiRequest";
import { ApiResponse } from "../../src/interfaces/ApiResponse";
import { DisplayAccount } from "../../src/models/DisplayAccount";
import { Util } from "../../src/utils/Util";

const router = Router();

type RegisterRequest = {
    username: string;
    email: string;
    password: string;
}

router.post("/register", async (req: ApiRequest, res: ApiResponse) => {
    if (!Util.assertObject(req.body, ["username", "email", "password"])) {
        return res.status(400).json({
            code: 400,
            error: "Bad Request",
        });
    }
    
    const body = req.body as RegisterRequest;
    const safe_username = body.username.replace(" ", "_").toLowerCase();

    if (await assertAccountDetail(res, { email: body.email }, "Email already in use.")) return;
    if (await assertAccountDetail(res, { username: body.username }, "Username already in use.")) return;
    if (await assertAccountDetail(res, { safe_username: safe_username }, "Username already in use.")) return;

    const account = await Database.account.create({
        data: {
            username: body.username,
            email: body.email,
            safe_username: safe_username,
            password: await argon2.hash(body.password, {
                type: argon2.argon2id,
            }),
        }
    });

    return res.status(200).json({
        code: 200,
        data: new DisplayAccount({
            ...account,
            groups: []
        }),
    })
});

async function assertAccountDetail(res: ApiResponse, where: Prisma.AccountWhereInput, message: string): Promise<boolean> {
    const existing = await Database.account.findFirst({ where });
    if (existing) {
        res.status(409).json({
            code: 409,
            error: message,
        });

        return true;
    }
    
    return false;
}

export { router };