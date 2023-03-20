import { Router } from "express";
import { ApiRequest } from "../../src/interfaces/ApiRequest";
import { ApiResponse } from "../../src/interfaces/ApiResponse";

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

export { router };