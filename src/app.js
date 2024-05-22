import express from "express";
import morgan from "morgan";
import { create as createHbs } from "express-handlebars";
import path from "path";

import apiRouter from "./api/routes/index.routes.js";
import pageRouter from "./page/routes/index.routes.js";
import { setSchedule } from "./services/schedule.service.js";
import { initPreferences } from "./config/preferences.config.js";
import { initDB } from "./config/db.config.js";

import { __dirname } from "./config/constants.config.js";

export default function () {
    // app setup
    const app = express();

    app.set("json spaces", 2);
    app.use(morgan("dev"));
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(express.static(path.join(__dirname, "src", "public")));

    // view engine setup
    app.set("views", path.join(__dirname, "src", "page", "views"));
    app.engine(
        ".hbs",
        createHbs({
            layoutsDir: path.join(app.get("views"), "layouts"),
            partialsDir: path.join(app.get("views"), "partials"),
            defaultLayout: "main",
            extname: ".hbs"
        }).engine
    );
    app.set("view engine", ".hbs");

    // routes
    app.use("/api", apiRouter);
    app.use("/", pageRouter);

    // error handler
    // app.use((_, res) => res.status(404).render('404'));

    async function initTasks() {
        try {
            await initDB();
        } catch (err) {
            console.log("ERROR: Database not initialized.");
            console.error(err);
            return;
        }

        try {
            await initPreferences();
        } catch (err) {
            console.log("ERROR: Couldn't read preferences.");
            console.error(err);
            return;
        }

        setSchedule();
    }

    initTasks().catch(console.error);

    return app;
}
