import { File } from "../models/File";

/**
 * A model that contains a list of files it is responsable for.
 */
export interface IHasFiles {
    /**
     * Available files in this model, with local filenames.
     */
    Files: Array<File>;

    /**
     * A combined hash representing the model, based on the files it contains.
     * Implementation specific.
     */
    Hash: string;

    LoadFiles(): Promise<void>;
}