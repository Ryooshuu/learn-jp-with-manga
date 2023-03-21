import { Volume as DbVolume } from "@prisma/client";
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
    let volume = await Database.volume.findFirst({
        where: { id: req.params.id },
        include: {
            chapters: {
                include: {
                    pages: true,
                }
            }
        }
    });

    if (!volume) {
        return res.status(404).json({
            code: 404,
            message: "Volume not found"
        });
    }

    return res.status(200).json(volume);
});

type VolumeCreation = {
    name: string;
    chapters?: string;
}

router.post("/:mangaid", async (req: ApiRequest, res: ApiResponse) => {
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

    if (!Util.assertObject(req.body, ["name"])) {
        return res.status(400).json({
            code: 400,
            message: "Missing required fields",
            data: ["name"]
        });
    }

    let manga_id = req.params.mangaid;
    let manga = await getMangaById(manga_id);

    if (!manga) {
        return res.status(404).json({
            code: 404,
            message: "Cannot add a volume to a manga that doesn't exist"
        });
    }

    let body = req.body as VolumeCreation;

    if (body.chapters) {
        let chapters = JSON.parse(body.chapters) as Array<{
            name: string;
            number: number;
        }>;
        
        let volume = await Database.volume.create({
            data: {
                name: body.name,
                chapters: {
                    createMany: {
                        data: chapters.map(chapter => {
                            return {
                                name: chapter.name,
                                number: chapter.number,
                                manga_id: manga_id
                            }
                        })
                    }
                }
            },
            include: {
                chapters: true
            }
        });

        return res.status(200).json({
            code: 200,
            data: volume
        });
    }

    let volume = await Database.volume.create({
        data: { name: body.name },
    });

    return res.status(200).json({
        code: 200,
        data: volume
    });
});

router.patch("/:id", async (req: ApiRequest, res: ApiResponse) => {
    if (!req.account)
        return res.status(401).json({
            code: 401,
            message: "Unauthorized"
        });

    if (!req.account.hasPermission(Permissions.EDIT_MANGA_METADATA))
        return res.status(403).json({
            code: 403,
            message: "Forbidden"
        });

    let volume = await Database.volume.findFirst({
        where: { id: req.params.id },
    });

    if (!volume) {
        return res.status(404).json({
            code: 404,
            message: "Volume not found"
        });
    }

    let transaction = new Transaction<DbVolume>();
    let proxy = transaction.startTransaction(volume);

    if (req.body.name)
        proxy.name = req.body.name;

    let changes = await transaction.commit("volumes");
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

    let newVolume = await Database.volume.findFirst({
        where: { id: req.params.id },
    })

    return res.status(200).json({
        code: 200,
        data: {
            changes: jsonChanges,
            volume: newVolume
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

    let volume = await Database.volume.findFirst({
        where: { id: req.params.id },
        include: {
            chapters: true
        }
    });

    if (!volume) {
        return res.status(404).json({
            code: 404,
            message: "Volume not found"
        });
    }

    for (let chapter of volume.chapters) {
        let pageManager = new PageModelManager();
        let pages = await getPagesByChapterId(chapter.id);
    
        if (pages && pages.length > 0)
            await pageManager.deleteMany(pages);
    }

    if (volume.chapters && volume.chapters.length > 0)
        await Database.chapter.deleteMany({
            where: { id: { in: volume.chapters.map(chapter => chapter.id) } }
        });

    await Database.volume.delete({
        where: { id: req.params.id },
    });

    return res.status(200).json({
        code: 200,
        message: "Volume deleted"
    })
});

export { router };