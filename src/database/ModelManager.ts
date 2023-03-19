import { Database } from "../../prisma";
import { File } from "../models/File";
import { GlobalSingleton } from "../utils/GlobalSingleton";
import { FileStore } from "./FileStore";
import { IHasFiles } from "./IHasFiles";
import { IHasGuidId } from "./IHasGuidId";

export abstract class ModelManager<TModel extends IHasGuidId & IHasFiles> {
    private fileStore: FileStore;

    constructor() {
        this.fileStore = GlobalSingleton.FileStore;
    }

    DeleteFile(item: TModel, file: File) {
        this.fileStore.Delete(file);
        item.Files = item.Files.filter(x => x.hash !== file.hash);
    }

    async ReplaceFile(item: TModel, file: File, contents: Buffer): Promise<File> {
        if (this.fileStore.Exists(file)) {
            await this.fileStore.Delete(file);
        }

        let newFile = await this.fileStore.Add(file.name, contents);

        item.Files = item.Files.filter(x => x.hash !== file.hash);
        item.Files.push(newFile);

        return await this.fileStore.Add(file.name, contents);
    }

    async AddFile(item: TModel, filename: string, contents: Buffer): Promise<File> {
        const existing = GetFile(item, filename);

        if (existing) {
            let replacement = await this.ReplaceFile(item, existing, contents);
            return replacement;
        }

        const file = await this.fileStore.Add(filename, contents);
        item.Files.push(file);

        return file;
    }

    DeleteMany(items: Array<TModel>) {
        if (items.length == 0) return;

        for (const item of items) {
            this.Delete(item);
        }
    }

    Delete(item: TModel) {
        this.GetTable().delete({ where: { id: item.id } });

        for (const file of item.Files) {
            this.fileStore.Delete(file);
        }
    }

    abstract GetManagedTable(): any;

    GetTable(): PrismaModel<TModel> {
        return this.GetManagedTable() as PrismaModel<TModel>;
    }
}

type PrismaModel<TModel extends IHasGuidId> = {
    readonly [p in keyof TModel]: TModel[p];
} & {
    findFirst: (args: { where: { id: string } }) => Promise<TModel | null>;
    delete: (args: { where: { id: string } }) => Promise<TModel>;
}

/**
 * Returns the file usage for the file in this model with the given filename, if any exists, otherwise null.
 * The path returned is relative to the user file storage.
 * The lookup is case insensitive.
 * @param model The model to operate on.
 * @param filename The name of the file to get the storage path of.
 */
export function GetFile(model: IHasFiles, filename: string): File | null {
    return model.Files.find(x => x.name.toLowerCase() === filename.toLowerCase()) || null;
}

export function GetFileByHash(model: IHasFiles, hash: string): File | null {
    return model.Files.find(x => x.hash === hash) || null;
}

export async function GetFileInDatabase(hash: string): Promise<File | null> {
    let existing = await Database.file.findFirst({ where: { hash } });

    if (!existing)
        return null;
    return new File(existing);
}