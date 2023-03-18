import { Router } from "express";
import { ApiRequest } from "../src/interfaces/ApiRequest";
import { ApiResponse } from "../src/interfaces/ApiResponse";

const router = Router();

router.get("/", async (req: ApiRequest, res: ApiResponse) => {   
    return res.status(418).json({
        status: 418,
        error: 418,
        data: {
            message: "I'm a teapot"
        }
    });
});

export default router;