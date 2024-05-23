import fs from "fs";
import net from "net";
import puppeteer from "puppeteer";
import axios from "axios";
import createApp from "./app.js";
import {
    config,
    promptPort,
    promptPuppeteerExecPath,
    PORT,
    PUPPETEER_EXEC_PATH,
    configTimeDiff
} from "./config/general.config.js";
import { URL_WORLD_TIME_API } from "./config/constants.config.js";
import { newDate } from "./helpers/utils.helper.js";
import { exec } from "child_process";

const PORT_KEY = "port";

run();

function run() {
    (async () => {
        console.log("======================================");
        console.log("=                                    =");
        console.log("=            Tutor Manager           =");
        console.log("=                                    =");
        console.log("======================================");
        console.log();

        console.log("Notes:");
        console.log(
            "1. You may edit/delete the .env file to modify/reset the configuration"
        );
        console.log(
            "2. You may also delete the ./db/db.sqlite3 file to reset the database (user, preferences, etc.)"
        );
        console.log();

        try {
            console.log("=========== Configuration ===========");

            const port = await getPort();
            console.log();
            const puppeteerExecPath = await getPuppeteerExecPath();
            console.log();
            await syncLocalTime();

            config({ port, puppeteerExecPath });

            console.log("Configuration complete");
            console.log("=====================================");
            console.log();

            const app = await initApp(port);
            startServer(app);
        } catch (err) {
            console.error(err);
        }
    })();
}

function startServer(app) {
    app.listen(app.get(PORT_KEY), onListening);
    app.on("error", onError);

    function onListening() {
        const port = app.get(PORT_KEY);
        console.log(`Server listening on port ${port}`);

        exec(`start http://localhost:${port}`, (err) => {
            if (err) {
                console.error(err);
                console.log(`Open http://localhost:${port} in your browser`);
                return;
            }

            console.log("App is running in your browser 🚀");
        });
    }

    function onError(err) {
        console.error(err);
    }
}

async function initApp(port) {
    const app = createApp();
    if (port) app.set(PORT_KEY, port);
    return app;
}

async function getPort() {
    let port;
    let errPrev;

    while (true) {
        if (errPrev || PORT === undefined) {
            port = await promptPort();
        } else {
            port = PORT;
        }

        try {
            await new Promise((res, rej) => {
                const serverTest = net.createServer();

                serverTest.once("error", (err) => {
                    if (["EACCES", "EADDRINUSE"].includes(err.code)) {
                        serverTest.close();
                        rej(err);
                    } else {
                        res();
                    }
                });

                serverTest.once("listening", () => {
                    serverTest.close();
                    res();
                });

                serverTest.listen(port);
            });

            break;
        } catch (err) {
            console.error(`Port ${port} is already in use`);
            errPrev = err;
        }
    }

    return port;
}

async function getPuppeteerExecPath() {
    let puppeteerExecPath;
    let errPrev;

    while (true) {
        if (errPrev || PUPPETEER_EXEC_PATH === undefined) {
            if (puppeteerExecPath === undefined) {
                console.log(
                    [
                        "This app works with Puppeteer for web scrapping. You need either:",
                        '1. the path to a Chromium-based browser\'s executable in your system (Chrome, Edge, etc.) - e.g. "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"',
                        '2. or puppeteer installed in your system (in folder "C:\\Users\\<your_user>\\.cache\\puppeteer") - see https://pptr.dev/guides/installation'
                    ].join("\n")
                );
                console.log();
            }
            puppeteerExecPath = await promptPuppeteerExecPath();
        } else {
            puppeteerExecPath = PUPPETEER_EXEC_PATH;
        }

        try {
            if (puppeteerExecPath !== "") {
                await fs.promises.access(puppeteerExecPath, fs.constants.X_OK);
            }

            const browser = await puppeteer.launch({
                headless: true,
                executablePath:
                    puppeteerExecPath !== "" ? puppeteerExecPath : undefined
            });
            await browser.close();
            break;
        } catch (err) {
            console.error("Invalid path. Please verify it exists.");
            errPrev = err;
        }
    }

    return puppeteerExecPath;
}

async function syncLocalTime() {
    try {
        const response = await axios.get(URL_WORLD_TIME_API);
        if (response.status !== 200) {
            throw new Error("Failed to get world time API");
        }

        // console.log(`Date before: ${newDate().toISOString()}`);

        const { datetime } = response.data;

        // console.log(
        //     `Date from world time API: ${newDate(datetime).toISOString()}`
        // );

        const timeDiff = newDate(datetime).getTime() - newDate().getTime();
        configTimeDiff(timeDiff);

        // console.log(`Date after: ${newDate().toISOString()}`);
    } catch (err) {
        console.error(err);
    }
}
