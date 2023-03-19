import { Database } from "../../prisma";
import { ModelManager } from "./ModelManager";
import { MangaModel } from "../models/MangaModel";

export class MangaModelManager extends ModelManager<MangaModel> {
    GetManagedTable() {
        return Database.manga;
    }

    async SetCover(item: MangaModel, filename: string, contents: Buffer) {
        if (item.Files.length > 0) {
            let cover = item.Files[0];

            await this.ReplaceFile(item, cover, contents);
            await this.updateCoverHash(item);
            return;
        }

        await this.AddFile(item, filename, contents);
        await this.updateCoverHash(item);
    }

    private async updateCoverHash(item: MangaModel) {
        if (item.Files.length > 0) {
            await Database.manga.update({
                where: { id: item.id },
                data: {
                    cover_hash: item.Files[0].hash
                }
            });
        } else {
            await Database.manga.update({
                where: { id: item.id },
                data: {
                    cover_hash: null
                }
            });
        }
    }
}
