import { db } from "../../config/db.config.js";

export function get(_, res) {
    db.serialize(() => {
        db.all(`SELECT * FROM User`, (err, users) => {
            if (err) {
                console.error(err);
                return res
                    .status(500)
                    .json({ message: "Internal server error" });
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
