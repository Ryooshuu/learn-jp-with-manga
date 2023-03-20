import { Router } from "express";
import { AccountModelManager } from "../src/database/AccountModelManager";
import { ApiRequest } from "../src/interfaces/ApiRequest";
import { ApiResponse } from "../src/interfaces/ApiResponse";
import { getAccountById } from "../src/models/Account";

const router = Router();

router.get("/account/:id/avatar", async (req: ApiRequest, res: ApiResponse) => {
    let account = await getAccountById(req.params.id);

    if (!account) {
        return res.status(404).json({
            code: 404,
            message: "The account you are looking for does not exist."
        });
    }

    if (!account.avatar) {
        // TODO: return a default image.
        return res.status(404).json({
            code: 404,
            message: "The account you are looking for does not have an avatar."
        });
    }

    res.setHeader("Content-Type", "image/webp");
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");

    let manager = new AccountModelManager();
    let file = manager.getBuffer(account.avatar);

    return res.status(200).send(file);
});

export { router };