import { File } from "../models/File";
import { Database } from "../../prisma";
import { Page } from "../models/Page";
import { ModelManager } from "./ModelManager";

export class PageModelManager extends ModelManager<Page> {
    getManagedTable() {
        return Database.page;
    }

    async SetImage(item: Page, filename: string, contents: Buffer) {
        if (item.Files.length > 0) {
            let image = item.Files[0];

            let newFile = await this.replaceFile(item, image, contents);
            await this.updateImageHash(item, newFile);
            return;
        }

        let file = await this.addFile(item, filename, contents);
        await this.updateImageHash(item, file);
    }

    async SetAnnotation(item: Page, filename: string, contents: Buffer) {
        if (item.Files.length > 1) {
            let annotation = item.Files[1];

            let newFile = await this.replaceFile(item, annotation, contents);
            await this.updateAnnotationHash(item, newFile);
            return;
        }

        let file = await this.addFile(item, filename, contents);
        await this.updateAnnotationHash(item, file);
    }

    private async updateImageHash(item: Page, file: File) {
        if (item.Files.length > 0) {
            await Database.page.update({
                where: { id: item.id },
                data: {
                    image_hash: file.hash
                }
            });
        } else {
            throw new Error("Page must have an image");
        }
    }

    private async updateAnnotationHash(item: Page, file: File) {
        if (item.Files.length > 1) {
            await Database.page.update({
                where: { id: item.id },
                data: {
                    annotation_hash: file.hash
                }
            });
        } else {
            throw new Error("Page must have an annotation");
        }
    }
}