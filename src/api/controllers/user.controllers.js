import sqlite3 from "sqlite3";
import { DB_PATH } from "../../constants.js";

const db = new (sqlite3.verbose().Database)(DB_PATH);

export function get(req, res) {
    db.serialize(() => {
        db.all(`SELECT * FROM User`, (err, users) => {
            if (err) {
                console.log(err);
                return res.status(500).json({ message: err.message });
            }
            if (users.length !== 1) {
                return res
                    .status(404)
                    .json({ message: "Found zero or more than one users" });
            }
            delete users[0]["Password"];
            res.status(200).json(users[0]);
        });
    });
}
