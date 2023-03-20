import jsonwebtoken from "jsonwebtoken";
import { NextFunction } from "express";
import { ApiRequest } from "../interfaces/ApiRequest";
import { ApiResponse } from "../interfaces/ApiResponse";
import { DisplayAccount } from "../models/DisplayAccount";
import { TokenType } from "../utils/Constants";
import { GlobalSingleton } from "../utils/GlobalSingleton";
import { decode } from "punycode";
import { Account } from "../models/Account";

interface TokenData extends DisplayAccount {
    token_type: TokenType;
}

export class AccountMiddleware {
    static async assertToken(token: string) {
        return new Promise((res, _) => {
            let secret = process.env.USE_RSA256_JWT === "true" ? GlobalSingleton.rsaPublicKey ?? "" : GlobalSingleton.jwtToken;

            jsonwebtoken.verify(token, secret, async (err, decoded) => {
                if (err || decoded === undefined) {
                    res(null);
                }

                res(decoded as TokenData);
            });

            return null;
        })
    }

    static async Handle(req: ApiRequest, res: ApiResponse, next: NextFunction) {
        if (!req.headers.authorization)
            return next();

        if (req.headers.authorization.split(" ")[0] !== "Account") {
            return next();
        }

        const token = req.headers.authorization.split(" ")[1];

        if (token) {
            const decodedData = await AccountMiddleware.assertToken(token);

            if (decodedData === null) {
                return next();
            }

            req.account = new DisplayAccount(decodedData as Account);
        }

        next();
    }
}