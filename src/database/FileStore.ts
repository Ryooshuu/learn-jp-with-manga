import fs from "fs";
import path from "path";
import { File } from "./File";
import { ComputeSha256Hash } from "../utils/hashing";
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

    async Add(filename: string, data: Buffer, addToDatabase = true): Promise<File> {
        let hash = ComputeSha256Hash(data);
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

    private copyToStore(file: File, data: Buffer): void {
        let storagePath = file.GetStorageDirectory();
        let targetPath = path.join(this.target, storagePath);
        
        if (!fs.existsSync(targetPath))
            fs.mkdirSync(targetPath, { recursive: true });

        fs.createWriteStream(path.join(this.target, file.GetStoragePath())).write(data);
    }

    private checkFileExistsAndMatchesHash(file: File): boolean {
        let storagePath = file.GetStoragePath();

        // we may be re-adding a file to fix missing store entries.
        if (!fs.existsSync(path.join(this.target, storagePath)))
            return false;

        let fileData = fs.readFileSync(path.join(this.target, storagePath));
        return ComputeSha256Hash(fileData) === file.hash;
    }
}