import fs from "fs";
import path from "path";
import { File } from "../models/File";
import { computeSha256Hash } from "../utils/hashing";
import { Database } from "../../prisma";

export class FileStore {
    /**
     * The path to the directory where the files are stored.
     */
    target: string;

    constructor(target: string) {
        this.target = target;

        if (!fs.existsSync(target))
            fs.mkdirSync(target, { recursive: true });
    }

    async add(filename: string, data: Buffer, addToDatabase = true): Promise<File> {
        let hash = computeSha256Hash(data);
        let existing = await Database.file.findFirst({
            where: { hash: hash }
        });
        let file = existing == null ? new File({ name: filename, hash: hash }) : new File(existing);

        if (!this.checkFileExistsAndMatchesHash(file)) {
            this.copyToStore(file, data);
        }

        if (addToDatabase) {
            await Database.file.upsert({
                where: { hash: file.hash },
                update: { name: file.name, hash: file.hash },
                create: { name: file.name, hash: file.hash }
            });
        }

        return file;
    }

    async delete(file: File): Promise<void> {
        fs.unlinkSync(path.join(this.target, file.getStoragePath()));

        await Database.file.delete({
            where: { hash: file.hash }
        });
    }

    exists(file: File): boolean {
        return fs.existsSync(path.join(this.target, file.getStoragePath()));
    }

    getPath(file: File): string {
        return path.join(this.target, file.getStoragePath());
    }

    getBuffer(file: File): Buffer {
        return fs.readFileSync(path.join(this.target, file.getStoragePath()));
    }

    private copyToStore(file: File, data: Buffer): void {
        let storagePath = file.getStorageDirectory();
        let targetPath = path.join(this.target, storagePath);
        
        if (!fs.existsSync(targetPath))
            fs.mkdirSync(targetPath, { recursive: true });

        fs.createWriteStream(path.join(this.target, file.getStoragePath())).write(data);
    }

    private checkFileExistsAndMatchesHash(file: File): boolean {
        let storagePath = file.getStoragePath();

        // we may be re-adding a file to fix missing store entries.
        if (!fs.existsSync(path.join(this.target, storagePath)))
            return false;

        let fileData = fs.readFileSync(path.join(this.target, storagePath));
        return computeSha256Hash(fileData) === file.hash;
    }
}