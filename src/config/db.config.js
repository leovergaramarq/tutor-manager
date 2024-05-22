import sqlite3 from "sqlite3";
import path from "path";
import fs from "fs";
import { __dirname, DB_PATH } from "./constants.config.js";

export function initDB() {
    return new Promise(async (res, rej) => {
        const dbScriptPath = path.join(
            __dirname,
            "src",
            "assets",
            "db.sqlite3.sql"
        );

        const statements = (await fs.promises.readFile(dbScriptPath))
            .toString()
            .split(";");

        db.serialize(() => {
            statements.forEach((statement) => {
                db.run(statement, (err) => {
                    if (err) {
                        return rej(err);
                    }
                });
            });

            res();
        });
    });
}

export const db = new (sqlite3.verbose().Database)(DB_PATH);
