import path from "path";
import { FileStore } from "../database/FileStore";

/**
 * A singleton containing global objects that are used throughout the application.
 */
export const GlobalSingleton = new class GlobalSingleton {
    public FileStore: FileStore;
    
    constructor() {
        this.FileStore = new FileStore(path.join(__dirname, "..", "..", "files"));
    }    
}