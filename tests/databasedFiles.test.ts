import fs from "fs";
import { FileStore } from "../src/database/FileStore";
import { File } from "../src/models/File";
import { Database } from "../prisma";

let store: FileStore;

beforeAll(() => {
    store = new FileStore(`./${new Date().getTime()}`);
})

afterAll(async () => {
    setTimeout(() => {
        fs.rmdirSync(store.target, { recursive: true });
    }, 100);
});

describe("databased files", () => {
    let file: File;
    
    test("create", async () => {
        file = await store.add("test.txt", Buffer.from("test"));
        expect(file).toBeDefined();
        expect(file.hash).toBeDefined();
        expect(file.name).toBe("test.txt");
    });

    test("is in database", async () => {
        let inDatabase = await Database.file.findFirst({
            where: { hash: file.hash }
        });

        expect(inDatabase).toBeDefined();
        expect(inDatabase?.hash).toBe(file.hash);
        expect(inDatabase?.name).toBe(file.name);
    });

    test("is in store", () => {
        expect(store.exists(file)).toBe(true);
    });

    test("create again", async () => {
        file = await store.add("test.txt", Buffer.from("test"));
        expect(file).toBeDefined();
        expect(file.hash).toBeDefined();
        expect(file.name).toBe("test.txt");
    });

    test("no duplicate in database", async () => {
        let inDatabase = await Database.file.findMany({
            where: { hash: file.hash }
        });

        expect(inDatabase.length).toBe(1);
    });

    test("no duplicate in store", () => {
        let path = store.getPath(file);
        let idx = 0;
        fs.lstat(path, (err, stats) => {
            expect(err).toBeNull();
            expect(stats.isFile()).toBe(true);
            expect(idx).toBe(0);
            idx++;
        });
    })

    test("buffer is correct", () => {
        expect(store.getBuffer(file).toString()).toBe("test");
    });

    test("delete", async () => {
        await store.delete(file);
        expect(store.exists(file)).toBe(false);
    });

    test("is not in database", async () => {
        let inDatabase = await Database.file.findFirst({
            where: { hash: file.hash }
        });

        expect(inDatabase).toBeNull();
    });
})