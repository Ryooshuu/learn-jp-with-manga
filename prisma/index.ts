import { PrismaClient } from "@prisma/client";

let database: PrismaClient;

if (process.env.NODE_ENV === "test") {
    database = new PrismaClient({
        datasources: {
            db: {
                url: "postgresql://postgres:postgres@localhost:5432/test"
            }
        }
    });
} else {
    database = new PrismaClient();
}

export let Database = database;