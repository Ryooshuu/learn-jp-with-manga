import fs from "fs";
import path from "path";
import { FileStore } from "../database/FileStore";

/**
 * A singleton containing global objects that are used throughout the application.
 */
export const GlobalSingleton = new class GlobalSingleton {
    public FileStore: FileStore;

    public rsaKey: Buffer | null = null;
    public rsaPublicKey: Buffer | null = null;
    public jwtToken: string;
    
    constructor() {
        let filesPath = path.join(__dirname, "..", "..", "files");
        this.FileStore = new FileStore(filesPath);

        if (process.env.USE_RSA256_JWT === "true") {
            this.rsaKey = fs.readFileSync(path.join(filesPath, process.env.RSA256_FILE ?? "rsa.key"));
            this.rsaPublicKey = fs.readFileSync(path.join(filesPath, process.env.RSA256_PUBLIC_FILE ?? "rsa.key.pub"));
        }

        this.jwtToken = process.env.JWT_SECRET ?? "";
    }    
}