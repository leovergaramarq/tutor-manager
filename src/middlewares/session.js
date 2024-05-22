import { db } from "../config/db.config.js";

export function loggedIn(req, res, next) {
    db.serialize(() => {
        db.all("SELECT * FROM User", (err, users) => {
            if (err) {
                console.error(err);
                return res
                    .status(500)
                    .render("error", { message: err.message });
            }
            if (users.length !== 1) {
                return res.status(302).redirect("login");
            }
            req.user = users[0]["Username"];
            next();
        });
    });
}

export function loggedOut(req, res, next) {
    db.serialize(() => {
        db.all("SELECT * FROM User", (err, users) => {
            if (err) {
                console.error(err);
                return res
                    .status(500)
                    .render("error", { message: err.message });
            }
            if (users.length === 1) {
                return res.status(302).redirect("/");
            }
            next();
        });
    });
}
