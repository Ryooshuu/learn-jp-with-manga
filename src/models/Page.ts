import { Page as DbPage } from "@prisma/client";
import { Database } from "../../prisma";
import { File } from "./File";
import { IHasFiles } from "../database/IHasFiles";
import { IHasGuidId } from "../database/IHasGuidId";
import { getFileInDatabase } from "../database/ModelManager";

export class Page implements DbPage, IHasGuidId, IHasFiles {
    id: string;
    index: number;
    image_hash: string | null;
    annotation_hash: string | null;
    chapter_id: string;

    Files: File[] = [];
    Hash: string = "";

    constructor(data: DbPage) {
        this.id = data.id;
        this.index = data.index;
        this.image_hash = data.image_hash;
        this.annotation_hash = data.annotation_hash;
        this.chapter_id = data.chapter_id;
    }

    async loadFiles(): Promise<void> {
        if (this.Files.length > 0)
            return;
        
        if (this.image_hash) {
            let file = await getFileInDatabase(this.image_hash);

            if (file)
                this.Files.push(file);
        }

        if (this.annotation_hash) {
            let file = await getFileInDatabase(this.annotation_hash);

            if (file)
                this.Files.push(file);
        }
    }

    get image(): File | null {
        if (this.Files.length > 0)
            return this.Files[0];

        return null;
    }

    get annotation(): File | null {
        if (this.Files.length > 1)
            return this.Files[1];

        return null;
    }

    toJson(): DbPage {
        return {
            id: this.id,
            index: this.index,
            image_hash: this.image_hash,
            annotation_hash: this.annotation_hash,
            chapter_id: this.chapter_id
        };
    }
}

export async function getPageById(id: string): Promise<Page | null> {
    let page = await Database.page.findFirst({
        where: { id: id },
    });

    if (!page)
        return null;

    let model = new Page(page);
    await model.loadFiles();

    return model;
}

export async function getPagesByChapterId(id: string): Promise<Array<Page> | null> {
    let pages = await Database.page.findMany({
        where: { chapter_id: id },
    });

    if (!pages)
        return null;

    let models = pages.map(p => new Page(p));
    await Promise.all(models.map(m => m.loadFiles()));

    return models;
}