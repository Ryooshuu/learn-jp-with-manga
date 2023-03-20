import { Router } from "express";
import { MangaModelManager } from "../src/database/MangaModelManager";
import { GetMangaById } from "../src/models/Manga";
import { ApiRequest } from "../src/interfaces/ApiRequest";
import { ApiResponse } from "../src/interfaces/ApiResponse";

const router = Router();

router.get("/", async (req: ApiRequest, res: ApiResponse) => {
    let modelManager = new MangaModelManager();
    let mangaModel = (await GetMangaById("9ddb198f-a621-477c-8b06-86e4fdde782e"))!;

    await modelManager.SetCover(mangaModel, "test.txt", Buffer.from("baba?"));
    await modelManager.SetCover(mangaModel, "test.txt", Buffer.from("meow?"));

    return res.status(418).json({
        status: 418,
        error: 418,
        data: {
            message: "I'm a teapot"
        }
    });
});

export default router;