import { db } from "../config/db.config.js";

export function save(cookies) {
    return new Promise((res, rej) => {
        db.serialize(() => {
            db.all("SELECT * FROM User", (err, rows) => {
                if (err) {
                    console.error(err);
                    return rej(err);
                }

                if (!rows.length) {
                    return rej("No user found");
                }
                db.run(
                    `UPDATE User SET Cookies = '${JSON.stringify(cookies)}'`,
                    (err) => {
                        if (err) {
                            console.error(err);
                            return rej(err);
                        }
                        res();
                    }
                );
            });
        });
    });
}
