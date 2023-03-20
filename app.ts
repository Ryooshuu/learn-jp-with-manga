import chalk from "chalk";
import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import multer from "multer";
import morgan from "morgan";

import { RouterMiddleware } from "./src/middleware/RouterMiddleware";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(multer().any());
app.use(morgan((tokens, req, res) => {
    let method = tokens.method(req, res);
    let bgHex = "#FFFFFF";

    switch (method) {
        case "GET": bgHex = "#00FFAA"; break;
        case "POST": bgHex = "#FFC800"; break;
        case "PUT": bgHex = "#00AAFF"; break;
        case "DELETE": bgHex = "#FF0040"; break;
        case "PATCH": bgHex = "#4000FF"; break;
    }

    method = chalk.bgHex(bgHex).black(` ${method} `);

    const status = parseInt(tokens.status(req, res) ?? "500");
    let statusString = "";
    let statusHeader;

    if (status >= 200 && status < 400) {
        statusString = chalk.bgHex("#00FFAA").black(` ${status} `);
        statusHeader = chalk.hex("#00FFAA")(" SUCCESS");
    } else if (status >= 400 && status < 500) {
        statusString = chalk.bgHex("#FF0040").black(` ${status} `);
        statusHeader = chalk.hex("#FF0040")(" FAILURE");
    } else if (status >= 500 && status < 600) {
        statusString = chalk.bgHex("#4000FF").black(` ${status} `);
        statusHeader = chalk.hex("#4000FF")("   ERROR");
    }

    const url = tokens.url(req, res);
    statusString = statusString.padStart(Math.max(1, 15 - (url?.length ?? 0)), "E");

    const now = new Date();
    const format = new Intl.DateTimeFormat();

    return [
        `[${chalk.gray(format.format(now))}]`,
        statusHeader,
        method,
        url,
        statusString,
        "-",
        tokens["response-time"](req, res) + "ms"
    ].join(" ");
}));

// TODO: Eventually have our own middlewares for account management, etc.

// Moduler file-based routing
RouterMiddleware.Handle(app);

app.listen(process.env.API_PORT, () => {
    const now = new Date();
    const format = new Intl.DateTimeFormat();

    console.log(`[${chalk.gray(format.format(now))}]  ${chalk.gray("API: ")}`);
    console.log(`[${chalk.gray(format.format(now))}]  Server started on port ${chalk.green(process.env.API_PORT)}.`);
    console.log();
})