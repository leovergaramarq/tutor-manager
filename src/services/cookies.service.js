import { db } from "../config/db.config.js";

export function save(cookies) {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            db.all("SELECT * FROM User", (err, rows) => {
                if (err) {
                    console.error(err);
                    return reject(err);
                }
                if (!rows.length) {
                    return reject("No user found");
                }
                db.run(
                    `UPDATE User SET Cookies='${JSON.stringify(cookies)}'`,
                    (err) => {
                        if (err) {
                            console.error(err);
                            return reject(err);
                        }
                        resolve();
                    }
                );
            });
        });
    });
}
