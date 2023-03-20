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

    deleteFile(item: TModel, file: File) {
        this.fileStore.delete(file);
        item.Files = item.Files.filter(x => x.hash !== file.hash);
    }

    async replaceFile(item: TModel, file: File, contents: Buffer): Promise<File> {
        if (this.fileStore.exists(file)) {
            await this.fileStore.delete(file);
        }

        let newFile = await this.fileStore.add(file.name, contents);

        item.Files = item.Files.filter(x => x.hash !== file.hash);
        item.Files.push(newFile);

        return await this.fileStore.add(file.name, contents);
    }

    async addFile(item: TModel, filename: string, contents: Buffer): Promise<File> {
        const existing = getFile(item, filename);

        if (existing) {
            let replacement = await this.replaceFile(item, existing, contents);
            return replacement;
        }

        const file = await this.fileStore.add(filename, contents);
        item.Files.push(file);

        return file;
    }

    deleteMany(items: Array<TModel>) {
        if (items.length == 0) return;

        for (const item of items) {
            this.delete(item);
        }
    }

    delete(item: TModel) {
        this.getTable().delete({ where: { id: item.id } });

        for (const file of item.Files) {
            this.fileStore.delete(file);
        }
    }

    getBuffer(file: File): Buffer {
        return this.fileStore.getBuffer(file);
    }

    abstract getManagedTable(): any;

    getTable(): PrismaModel<TModel> {
        return this.getManagedTable() as PrismaModel<TModel>;
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
export function getFile(model: IHasFiles, filename: string): File | null {
    return model.Files.find(x => x.name.toLowerCase() === filename.toLowerCase()) || null;
}

export function getFileByHash(model: IHasFiles, hash: string): File | null {
    return model.Files.find(x => x.hash === hash) || null;
}

export async function getFileInDatabase(hash: string): Promise<File | null> {
    let existing = await Database.file.findFirst({ where: { hash } });

    if (!existing)
        return null;
    return new File(existing);
}