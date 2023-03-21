import { Page as DbPage } from "@prisma/client";
import { Router } from "express";
import sharp from "sharp";
import { Database } from "../../prisma";
import { PageModelManager } from "../../src/database/PageModelManager";
import { Transaction } from "../../src/database/Transaction";
import { ApiRequest } from "../../src/interfaces/ApiRequest";
import { ApiResponse } from "../../src/interfaces/ApiResponse";
import { getPageById } from "../../src/models/Page";
import { Permissions } from "../../src/utils/Constants";
import { Util } from "../../src/utils/Util";

const router = Router();

router.get("/:id", async (req: ApiRequest, res: ApiResponse) => {
    let page = await Database.page.findFirst({
        where: { id: req.params.id },
        include: {
            chapter: true,
        }
    });

    if (!page) {
        return res.status(404).json({
            code: 404,
            message: "Page not found"
        });
    }

    return res.status(200).json(page);
});

type PageCreation = {
    index: number;
}

router.post("/:chapter", async (req: ApiRequest, res: ApiResponse) => {
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

    if (!Util.assertObject(req.body, ["index"])) {
        return res.status(400).json({
            code: 400,
            message: "Missing required fields",
            data: ["index"]
        });
    }

    let chapter_id = req.params.chapter;
    let chapter = await Database.chapter.findFirst({
        where: { id: chapter_id },
    });

    if (!chapter) {
        return res.status(404).json({
            code: 404,
            message: "Cannot add a page to a chapter that doesn't exist"
        });
    }

    let body = req.body as PageCreation;

    const files = req.files as Express.Multer.File[];

    if (!files) {
        return res.status(400).json({
            code: 400,
            message: "Missing required file fields",
            data: ["image", "annotation"]
        });
    }

    let image = files.find(file => file.fieldname === "image");

    if (!image) {
        return res.status(400).json({
            code: 400,
            message: "Missing required file fields. It must contain an image file",
            data: ["image"]
        });
    }

    let imageExtensions = ["png", "jpg", "jpeg", "webp"];
    let imageExtension = image.originalname.split(".").pop();

    if (!imageExtensions.includes(imageExtension!)) {
        return res.status(400).json({
            code: 400,
            message: "The image file you uploaded does not match the required file types",
            data: {
                allowed: imageExtensions,
            }
        });
    }

    let imageBuffer = await sharp(image.buffer)
        .webp({
            quality: 95
        })
        .toBuffer();

    let annotation = files.find(file => file.fieldname === "annotation");

    if (!annotation) {
        return res.status(400).json({
            code: 400,
            message: "Missing required file fields. It must contain a JSON file",
            data: ["annotation"]
        });
    }

    let annotationExtensions = ["json"];
    let annotationExtension = annotation.originalname.split(".").pop();

    if (!annotationExtensions.includes(annotationExtension!)) {
        return res.status(400).json({
            code: 400,
            message: "The annotation file you uploaded does not match the required file types",
            data: {
                allowed: annotationExtensions,
            }
        });
    }

    let page = await Database.page.create({
        data: {
            index: parseInt(body.index.toString()),
            chapter_id: chapter_id,
        }
    });

    // we know this exists because we just created it
    let model = (await getPageById(page.id))!;

    let manager = new PageModelManager();
    await manager.SetImage(model, image.originalname, imageBuffer);
    await manager.SetAnnotation(model, annotation.originalname, annotation.buffer);

    let newModel = await Database.page.findFirst({
        where: { id: page.id },
    })

    return res.status(200).json({
        code: 200,
        data: newModel
    });
});

router.patch("/:id", async (req: ApiRequest, res: ApiResponse) => {
    if (!req.account)
        return res.status(401).json({
            code: 401,
            message: "Unauthorized"
        });

    if (!req.account.hasPermission(Permissions.EDIT_MANGA_PAGES))
        return res.status(403).json({
            code: 403,
            message: "Forbidden"
        });

    let page = await getPageById(req.params.id);

    if (!page) {
        return res.status(404).json({
            code: 404,
            message: "Page not found"
        });
    }

    const files = req.files as Express.Multer.File[];

    let manager = new PageModelManager();
    let changes = [];

    if (files.find(file => file.fieldname === "image")) {
        if (!req.account.hasPermission(Permissions.MANAGE_MANGA))
            return res.status(403).json({
                code: 403,
                message: "You may not edit the image of a page"
            });

        let image = files.find(file => file.fieldname === "image")!;

        let extensions = ["png", "jpg", "jpeg", "webp"];
        let extension = image.originalname.split(".").pop();

        if (!extensions.includes(extension!)) {
            return res.status(400).json({
                code: 400,
                message: "The image file you uploaded does not match the required file types",
                data: {
                    allowed: extensions,
                }
            });
        }

        let imageBuffer = await sharp(image.buffer)
            .webp({
                quality: 95
            })
            .toBuffer();

        await manager.SetImage(page, image.originalname, imageBuffer);
        changes.push("image");
    }

    if (files.find(file => file.fieldname === "annotation")) {
        let annotation = files.find(file => file.fieldname === "annotation")!;

        let extensions = ["json"];
        let extension = annotation.originalname.split(".").pop();

        if (!extensions.includes(extension!)) {
            return res.status(400).json({
                code: 400,
                message: "The annotation file you uploaded does not match the required file types",
                data: {
                    allowed: extensions,
                }
            });
        }

        await manager.SetAnnotation(page, annotation.originalname, annotation.buffer);
        changes.push("annotation");
    }

    let transaction = new Transaction<DbPage>();
    let proxy = transaction.startTransaction(page);

    if (req.body.index)
        proxy.index = parseInt(req.body.index);

    let transactionChanges = await transaction.commit("pages");

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

    const newModel = await getPageById(page.id);

    return res.status(200).json({
        code: 200,
        data: {
            changes,
            page: newModel!.toJson()
        }
    })
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

    let page = await getPageById(req.params.id);

    if (!page) {
        return res.status(404).json({
            code: 404,
            message: "Page not found"
        });
    }

    let manager = new PageModelManager();
    await manager.delete(page);

    return res.status(200).json({
        code: 200,
        message: "Page deleted"
    })
});

export { router };