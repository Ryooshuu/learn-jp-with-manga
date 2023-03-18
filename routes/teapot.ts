import { Router } from "express";
import path from "path";
import { FileStore } from "../src/database/FileStore";
import { ApiRequest } from "../src/interfaces/ApiRequest";
import { ApiResponse } from "../src/interfaces/ApiResponse";

const router = Router();

router.get("/", async (req: ApiRequest, res: ApiResponse) => {
    let store = new FileStore(path.join(__dirname, "..", "files"));
    await store.Add("test.txt", Buffer.from("meow?"));
    
    return res.status(418).json({
        status: 418,
        error: 418,
        data: {
            message: "I'm a teapot"
        }
    });
});

export default router;