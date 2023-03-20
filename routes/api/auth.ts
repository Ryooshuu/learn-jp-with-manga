import argon2 from "argon2";
import jsonwebtoken from "jsonwebtoken";
import { Prisma } from "@prisma/client";
import { Router } from "express";
import { Database } from "../../prisma";
import { ApiRequest } from "../../src/interfaces/ApiRequest";
import { ApiResponse } from "../../src/interfaces/ApiResponse";
import { DisplayAccount } from "../../src/models/DisplayAccount";
import { Util } from "../../src/utils/Util";
import { TokenType } from "../../src/utils/Constants";
import { GlobalSingleton } from "../../src/utils/GlobalSingleton";

const router = Router();

type RegisterRequest = {
    username: string;
    email: string;
    password: string;
}

router.post("/register", async (req: ApiRequest, res: ApiResponse) => {
    if (!Util.AssertObject(req.body, ["username", "email", "password"])) {
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

type LoginRequest = {
    email: string;
    password: string;
}

router.post("/login", async (req: ApiRequest, res: ApiResponse) => {
    let body: LoginRequest;
    
    if (req.headers["authorization"]?.startsWith("Basic")) {
        const header = req.headers["authorization"].slice(6);
        const decoded = Buffer.from(header, "base64").toString("utf-8");
        const split = decoded.split(":");

        body = {
            email: split[0],
            password: split[1],
        };
    } else {
        if (!Util.AssertObject(req.body, ["email", "password"])) {
            return res.status(400).json({
                code: 400,
                error: "Bad Request",
            });
        }

        if (typeof req.body.email !== "string" || typeof req.body.password !== "string") {
            return res.status(400).json({
                code: 400,
                error: "Bad Request",
            });
        }

        body = req.body as LoginRequest;
    }

    const account = await Database.account.findFirst({
        where: {
            email: body.email,
        },
        include: {
            groups: true,
        }
    });

    if (!account) {
        return res.status(401).json({
            code: 401,
            error: "Account does not exist.",
        });
    }

    if (!await argon2.verify(account.password, body.password)) {
        return res.status(401).json({
            code: 401,
            error: "Incorrect password.",
        });
    }

    let token;
    let payload = {
        ...new DisplayAccount({
            ...account,
        }),
        token_type: TokenType.SESSION
    };

    if (process.env.USE_RSA256_JWT === "true") {
        token = jsonwebtoken.sign(payload, GlobalSingleton.rsaKey ?? "", {
            algorithm: "RS256",
            expiresIn: "7d"
        });
    } else {
        token = jsonwebtoken.sign(payload, GlobalSingleton.jwtToken, {
            expiresIn: "7d"
        });
    }

    let countryCode = req.headers["cf-ipcountry"] as string;

    let session = await Database.session.create({
        data: {
            expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
            token: token,
            account_id: account.id,
            ip_address: req.ip,
            country_code: countryCode,
            user_agent: req.get("User-Agent")!,
        }
    });

    return res.status(200).json({
        code: 200,
        data: {
            payload: payload,
            session: session,
        }
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