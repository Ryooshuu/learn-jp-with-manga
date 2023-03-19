import { Application, NextFunction, Router } from "express";
import fs from "fs";
import path from "path";
import { ApiRequest, ErrorObject } from "../interfaces/ApiRequest";
import { ApiResponse } from "../interfaces/ApiResponse";

const BASE_PATH = path.join(__dirname, "..", "..", "routes");

export class RouterMiddleware {
    private static async importRoutes(app: Application, routesPath: string) {
        let paths = fs.readdirSync(routesPath);

        for (const file of paths) {
            if (fs.lstatSync(path.join(routesPath, file)).isDirectory()) {
                this.importRoutes(app, path.join(routesPath, file));
                continue;
            }

            if (!file.endsWith(".ts")) continue;

            await this.importRoute(app, path.join(routesPath, file));
        }
    }

    private static async importRoute(app: Application, file: string) {
        const route = await import(file);

        const routePath = file.replace(BASE_PATH, "").replace(".ts", "").replace(/\\/g, "/");

        const keys = Object.keys(route);
        for (const key of keys) {
            const router: Router = route[key];

            if (router.stack) {
                router.use((err: ErrorObject, req: ApiRequest, res: ApiResponse, _: NextFunction) => {
                    if (err) {
                        return res.status(err.status).json(err);
                    }
                });

                app.use(routePath, router);
            }
        }
    }

    static Handle(app: Application) {
        this.importRoutes(app, BASE_PATH);
    }
}