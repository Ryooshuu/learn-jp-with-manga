import { Manga as DbManga } from "@prisma/client";
import { MangaStatus, MangaDemographic } from "@prisma/client";
import { Router } from "express";
import sharp from "sharp";
import { Database } from "../../prisma";
import { MangaModelManager } from "../../src/database/MangaModelManager";
import { Transaction } from "../../src/database/Transaction";
import { ApiRequest } from "../../src/interfaces/ApiRequest";
import { ApiResponse } from "../../src/interfaces/ApiResponse";
import { getMangaById } from "../../src/models/Manga";
import { Permissions } from "../../src/utils/Constants";

const router = Router();

router.get("/:id", async (req: ApiRequest, res: ApiResponse) => {
    let manga = await getMangaById(req.params.id);

    if (!manga) {
        res.status(404).json({
            code: 404,
            message: "Manga not found."
        });
    }

    return res.status(200).json(manga!.toJson());
});

type CreateMangaBody = {
    title: string;
    alternative_titles?: string[];
    authors: string[];
    artists: string[];
    description: string;
    genres?: string[];
    themes?: string[];
    demographic?: string;
    status?: string;
}

router.post("/", async (req: ApiRequest, res: ApiResponse) => {
    if (!req.account)
        return res.status(401).json({
            code: 401,
            message: "Unauthorized."
        });

    if (!req.account.hasPermission(Permissions.CREATE_MANGA))
        return res.status(403).json({
            code: 403,
            message: "Forbidden."
        });

    let body = req.body as CreateMangaBody;

    if (!body.title || !body.authors || !body.artists || !body.description)
        return res.status(400).json({
            code: 400,
            message: "Missing required fields.",
            data: {
                required: ["title", "authors", "artists", "description"]
            }
        });

    body.authors = JSON.parse(req.body.authors);
    body.artists = JSON.parse(req.body.artists);

    if (body.alternative_titles)
        body.alternative_titles = JSON.parse(req.body.alternative_titles);

    if (body.genres)
        body.genres = JSON.parse(req.body.genres);

    if (body.themes)
        body.themes = JSON.parse(req.body.themes);

    if (body.demographic) {
        if (!Object.values(MangaDemographic).includes(body.demographic as MangaDemographic))
            return res.status(400).json({
                code: 400,
                message: "Invalid demographic.",
                data: {
                    valid: Object.values(MangaDemographic)
                }
            });
    }

    if (body.status) {
        if (!Object.values(MangaStatus).includes(body.status as MangaStatus))
            return res.status(400).json({
                code: 400,
                message: "Invalid status.",
                data: {
                    valid: Object.values(MangaStatus)
                }
            });
    }

    let publicized = new Date();

    if (req.body.publicized_at) {
        let date = new Date(req.body.publicized_at);

        if (date.toString() !== "Invalid Date")
            publicized = date;
    }

    let manga = await Database.manga.create({
        data: {
            title: body.title,
            alternative_titles: body.alternative_titles,
            authors: body.authors,
            artists: body.artists,
            description: body.description,
            genres: body.genres,
            themes: body.themes,
            demographic: body.demographic as MangaDemographic,
            status: body.status as MangaStatus,
            publicized_at: publicized
        }
    });

    return res.status(200).json({
        code: 200,
        data: manga
    });
});

type UpdateMangaBody = {
    title?: string;
    alternative_titles?: string[];
    authors?: string[];
    artists?: string[];
    description?: string;
    genres?: string[];
    themes?: string[];
    demographic?: string;
    status?: string;
}

router.patch("/:id", async (req: ApiRequest, res: ApiResponse) => {
    if (!req.account)
        return res.status(401).json({
            code: 401,
            message: "Unauthorized."
        });

    if (!req.account.hasPermission(Permissions.EDIT_MANGA_METADATA))
        return res.status(403).json({
            code: 403,
            message: "Forbidden."
        });

    let manga = await getMangaById(req.params.id);

    if (!manga)
        return res.status(404).json({
            code: 404,
            message: "Manga not found."
        });

    let body = req.body as UpdateMangaBody;

    if (body.demographic) {
        if (!Object.values(MangaDemographic).includes(body.demographic as MangaDemographic))
            return res.status(400).json({
                code: 400,
                message: "Invalid demographic.",
                data: {
                    valid: Object.values(MangaDemographic)
                }
            });
    }

    if (body.status) {
        if (!Object.values(MangaStatus).includes(body.status as MangaStatus))
            return res.status(400).json({
                code: 400,
                message: "Invalid status.",
                data: {
                    valid: Object.values(MangaStatus)
                }
            });
    }

    let changes = [];

    const files = req.files as Express.Multer.File[];

    if (files.find(file => file.fieldname === "cover")) {
        if (!req.account.hasPermission(Permissions.EDIT_MANGA_COVER))
            return res.status(403).json({
                code: 403,
                message: "You are not authorized to edit manga covers.",
                required: [
                    "EDIT_MANGA_COVER"
                ]
            });

        const file = files.find(file => file.fieldname === "cover")!;

        let extensions = ["png", "jpg", "jpeg", "webp"];
        let extension = file.originalname.split(".").pop();

        if (!extensions.includes(extension!))
            return res.status(415).json({
                code: 415,
                message: "The file you uploaded does not match the required file type.",
                data: {
                    allowed: extensions
                }
            });

        let coverBuffer = await sharp(file.buffer)
            .webp({
                quality: 80
            })
            .toBuffer();

        let manager = new MangaModelManager();
        await manager.SetCover(manga, file.originalname, coverBuffer);

        changes.push("cover");
    }

    let transaction = new Transaction<DbManga>();
    let proxy = transaction.startTransaction(manga);

    if (body.title)
        proxy.title = body.title;

    if (body.alternative_titles)
        proxy.alternative_titles = JSON.parse(req.body.alternative_titles);

    if (body.authors)
        proxy.authors = JSON.parse(req.body.authors);

    if (body.artists)
        proxy.artists = JSON.parse(req.body.artists);

    if (body.description)
        proxy.description = body.description;

    if (body.genres)
        proxy.genres = JSON.parse(req.body.genres);

    if (body.themes)
        proxy.themes = JSON.parse(req.body.themes);

    if (body.demographic)
        proxy.demographic = body.demographic as MangaDemographic;

    if (body.status)
        proxy.status = body.status as MangaStatus;

    let transactionChanges = await transaction.commit("mangas");

    if (transactionChanges.size > 0) {
        let transactionChangesArray = Array.from(transactionChanges.keys());
        changes = changes.concat(transactionChangesArray);
    }

    if (changes.length === 0) {
        return res.status(200).json({
            code: 200,
            message: "No changes were made."
        });
    }

    let newManga = await getMangaById(req.params.id);

    return res.status(200).json({
        code: 200,
        data: {
            changes: changes,
            manga: newManga!.toJson()
        }
    })
});

router.delete("/:id", async (req: ApiRequest, res: ApiResponse) => {
    if (!req.account)
        return res.status(401).json({
            code: 401,
            message: "Unauthorized."
        });

    if (!req.account.hasPermission(Permissions.EDIT_MANGA_METADATA))
        return res.status(403).json({
            code: 403,
            message: "Forbidden."
        });
    
    let manga = await getMangaById(req.params.id);

    if (!manga)
        return res.status(404).json({
            code: 404,
            message: "Manga not found."
        });

    let manager = new MangaModelManager();
    await manager.delete(manga);

    return res.status(200).json({
        code: 200,
        message: "Manga has been deleted."
    });
});

export { router };