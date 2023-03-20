import { Manga as DbManga, MangaDemographic, MangaStatus } from "@prisma/client";
import { Database } from "../../prisma";
import { File } from "./File";
import { IHasFiles } from "../database/IHasFiles";
import { IHasGuidId } from "../database/IHasGuidId";
import { getFileInDatabase } from "../database/ModelManager";

export class Manga implements DbManga, IHasGuidId, IHasFiles {
    id: string;
    title: string;
    alternative_titles: string[];
    authors: string[];
    artists: string[];
    description: string;
    genres: string[];
    themes: string[];
    demographic: MangaDemographic | null;
    status: MangaStatus | null;
    cover_hash: string | null;
    publicized_at: Date;
    created_at: Date;
    updated_at: Date;

    Files: File[] = [];
    Hash: string = "";

    constructor(data: DbManga) {
        this.id = data.id;
        this.title = data.title;
        this.alternative_titles = data.alternative_titles;
        this.authors = data.authors;
        this.artists = data.artists;
        this.description = data.description;
        this.genres = data.genres;
        this.themes = data.themes;
        this.demographic = data.demographic;
        this.status = data.status;
        this.cover_hash = data.cover_hash;
        this.publicized_at = data.publicized_at;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
    }

    async loadFiles(): Promise<void> {
        if (this.Files.length > 0)
            return;

        if (this.cover_hash) {
            let file = await getFileInDatabase(this.cover_hash);

            if (file)
                this.Files.push(file);
        }
    }

    get cover(): File | null {
        if (this.Files.length > 0)
            return this.Files[0];

        return null;
    }
}

export async function getMangaById(id: string): Promise<Manga | null> {
    let manga = await Database.manga.findFirst({ where: { id: id } });

    if (!manga)
        return null;

    let model = new Manga(manga);
    await model.loadFiles();

    return model;
}