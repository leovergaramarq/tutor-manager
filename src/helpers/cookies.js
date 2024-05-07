import sqlite3 from "sqlite3";
import { DB_PATH } from "../constants.js";

export function save(cookies) {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            db.all("SELECT * FROM User", (err, rows) => {
                if (err) {
                    console.log(err);
                    return reject(err);
                }
                if (!rows.length) {
                    console.log("No user found");
                    return reject("No user found");
                }
                db.run(
                    `UPDATE User SET Cookies='${JSON.stringify(cookies)}'`,
                    (err) => {
                        if (err) {
                            console.log(err);
                            return reject(err);
                        }
                        resolve();
                    }
                );
            });
        });
    });
}

// export function load() {
//     return new Promise((resolve, reject) => {
//         db.serialize(() => {
//             db.all('SELECT * FROM User', (err, rows) => {
//                 if (err) {
//                     console.log(err);
//                     return reject(err);
//                 }
//                 if (!rows.length) {
//                     console.log('No user found');
//                     return reject('No user found');
//                 }
//                 resolve(rows[0]['Cookies'] ? JSON.parse(rows[0]['Cookies']) : null);
//             });
//         });
//     });
// }

const db = new (sqlite3.verbose().Database)(DB_PATH);
