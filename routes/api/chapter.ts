import { Chapter as DbChapter } from "@prisma/client";
import { Router } from "express";
import { Database } from "../../prisma";
import { PageModelManager } from "../../src/database/PageModelManager";
import { Transaction } from "../../src/database/Transaction";
import { ApiRequest } from "../../src/interfaces/ApiRequest";
import { ApiResponse } from "../../src/interfaces/ApiResponse";
import { getMangaById } from "../../src/models/Manga";
import { getPagesByChapterId } from "../../src/models/Page";
import { Permissions } from "../../src/utils/Constants";
import { Util } from "../../src/utils/Util";

const router = Router();

router.get("/:id", async (req: ApiRequest, res: ApiResponse) => {
    let chapter = await Database.chapter.findFirst({
        where: { id: req.params.id, },
        include: {
            pages: true
        }
    });

    if (!chapter) {
        return res.status(404).json({
            code: 404,
            message: "Chapter not found"
        });
    }

    return res.status(200).json(chapter);
});

type ChapterCreation = {
    name: string;
    number: number;
}

router.post("/:manga/:volume", async (req: ApiRequest, res: ApiResponse) => {
    if (!req.account)
        return res.status(401).json({
            code: 401,
            message: "Unauthorized"
        });

    if (!req.account.hasPermission(Permissions.MANAGE_MANGA))
        return res.status(403).json({
            code: 403,
            message: "Forbidden"
        });

    if (!Util.assertObject(req.body, ["name", "number"])) {
        return res.status(400).json({
            code: 400,
            message: "Missing required fields",
            data: ["name", "number"]
        });
    }

    let manga_id = req.params.manga;
    let manga = await getMangaById(manga_id);

    if (!manga) {
        return res.status(404).json({
            code: 404,
            message: "Cannot add a chapter to a manga that doesn't exist"
        });
    }

    let volume_id = req.params.volume;
    let volume = await Database.volume.findFirst({
        where: { id: volume_id },
    });

    if (!volume) {
        return res.status(404).json({
            code: 404,
            message: "Cannot add a chapter to a volume that doesn't exist"
        });
    }

    let body = req.body as ChapterCreation;

    let chapter = await Database.chapter.create({
        data: {
            name: body.name,
            number: parseInt(body.number.toString()),
            volume_id: volume_id,
            manga_id: manga_id
        },
    });

    return res.status(200).json({
        code: 200,
        data: chapter
    });
});

router.patch("/:id", async (req: ApiRequest, res: ApiResponse) => {
    if (!req.account)
        return res.status(401).json({
            code: 401,
            message: "Unauthorized"
        });

    if (!req.account.hasPermission(Permissions.MANAGE_MANGA))
        return res.status(403).json({
            code: 403,
            message: "Forbidden"
        });

    let chapter = await Database.chapter.findFirst({
        where: { id: req.params.id },
    });

    if (!chapter) {
        return res.status(404).json({
            code: 404,
            message: "Chapter not found"
        });
    }

    if (req.body.volume_id) {
        let volume = await Database.volume.findFirst({
            where: { id: req.body.volume_id },
        });

        if (!volume) {
            return res.status(404).json({
                code: 404,
                message: "Volume not found"
            });
        }
    }

    let transaction = new Transaction<DbChapter>();
    let proxy = transaction.startTransaction(chapter);

    if (req.body.name)
        proxy.name = req.body.name;

    if (req.body.number)
        proxy.number = req.body.number;

    if (req.body.volume_id)
        proxy.volume_id = req.body.volume_id;

    let changes = await transaction.commit("chapters");
    let jsonChanges = [];

    for (let change of changes.values()) {
        jsonChanges.push(change.newValue)
    }

    if (jsonChanges.length === 0) {
        return res.status(304).json({
            code: 304,
            message: "No changes were made"
        });
    }

    let newChapter = await Database.chapter.findFirst({
        where: { id: req.params.id },
    })

    return res.status(200).json({
        code: 200,
        data: {
            changes: jsonChanges,
            chapter: newChapter
        }
    });
});

router.delete("/:id", async (req: ApiRequest, res: ApiResponse) => {
    if (!req.account)
        return res.status(401).json({
            code: 401,
            message: "Unauthorized"
        });

    if (!req.account.hasPermission(Permissions.MANAGE_MANGA))
        return res.status(403).json({
            code: 403,
            message: "Forbidden"
        });

    let chapter = await Database.chapter.findFirst({
        where: { id: req.params.id },
    });

    if (!chapter) {
        return res.status(404).json({
            code: 404,
            message: "Chapter not found"
        });
    }

    let pageManager = new PageModelManager();
    let pages = await getPagesByChapterId(req.params.id);

    if (pages && pages.length > 0)
        await pageManager.deleteMany(pages);

    await Database.chapter.delete({
        where: { id: req.params.id },
    });

    return res.status(200).json({
        code: 200,
        message: "Chapter deleted"
    })
});

export { router };