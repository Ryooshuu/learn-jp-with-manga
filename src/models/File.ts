import path from "path";
import { File as DbFile } from "@prisma/client";

export class File implements DbFile {
    hash: string;
    name: string;

    constructor(file: DbFile) {
        this.hash = file.hash;
        this.name = file.name;
    }
       
    getStoragePath(): string {
        return path.join(this.hash.substring(0, 1), this.hash.substring(0, 2), this.hash);
    }
       
    getStorageDirectory(): string {
        return path.join(this.hash.substring(0, 1), this.hash.substring(0, 2));
    }
}