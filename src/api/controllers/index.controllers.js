import puppeteer from "puppeteer";
import { db } from "../../config/db.config.js";
import { sleep } from "../../helpers/utils.helper.js";
import { URL_BILLING, URL_USD } from "../../config/constants.config.js";
import { save as saveCookies } from "../../services/cookies.service.js";
import { decodeBase64, encodeBase64 } from "../../services/auth.service.js";
import { PUPPETEER_EXEC_PATH } from "../../config/general.config.js";

export function hello(_, res) {
    db.serialize(() => {
        db.all('SELECT "Database running!" AS Result', (err, rows) => {
            if (err) {
                console.error(err);
                return res
                    .status(500)
                    .json({ message: "Internal server error" });
            }
            res.status(200).json({ message: rows[0]?.Result });
        });
    });
}

export function login(req, res) {
    const { username, password } = req.body;

    if (!username || !password)
        return res
            .status(400)
            .json({ message: "Missing username or password" });

    if (username.length < 4 || password.length < 4)
        return res.status(400).json({
            message: "Username and password must be at least 4 characters long"
        });

    db.serialize(() => {
        db.all("SELECT * FROM User", (err, users) => {
            if (err) {
                console.error(err);
                return res
                    .status(500)
                    .json({ message: "Internal server error" });
            }

            const insertUser = () => {
                db.run(
                    `INSERT INTO User (Username, Password) VALUES ('${username}', '${encodeBase64(
                        password
                    )}')`,
                    (err) => {
                        if (err) {
                            console.error(err);
                            return res
                                .status(500)
                                .json({ message: err.message });
                        }
                        res.status(201).json({
                            message: "Logged in successfully"
                        });
                    }
                );
            };

            if (!users.length) {
                insertUser();
            } else if (users.length > 1) {
                db.run("DELETE FROM User", (err) => {
                    if (err) {
                        console.error(err);
                        return res
                            .status(500)
                            .json({ message: "Internal server error" });
                    }
                    insertUser();
                });
            } else {
                if (
                    users[0]["Username"] !== username ||
                    users[0]["Password"] !== encodeBase64(password)
                ) {
                    console.log("Updating user");
                    db.run(
                        `UPDATE User SET Username=${username}, Password=${password}`,
                        (err) => {
                            if (err) {
                                console.error(err);
                                return res
                                    .status(500)
                                    .json({ message: err.message });
                            }
                            res.status(201).json({
                                message: "Logged in successfully"
                            });
                        }
                    );
                } else {
                    return res
                        .status(201)
                        .json({ message: "Logged in successfully" });
                }
            }
        });
    });
}

export function logout(_, res) {
    db.serialize(() => {
        db.run("DELETE FROM User", (err) => {
            if (err) {
                console.error(err);
                return res
                    .status(500)
                    .json({ message: "Internal server error" });
            }
            res.status(201).json({ message: "Logged out successfully" });
        });
    });
}

export function billing(_, res) {
    db.serialize(() => {
        db.all("SELECT * FROM User", async (err, users) => {
            if (err) {
                console.error(err);
                return res
                    .status(500)
                    .json({ message: "Internal server error" });
            }
            if (users.length !== 1) {
                return res.status(500).json({ message: "No existing users" });
            }

            try {
                // start puppeteer
                const browser = await puppeteer.launch({
                    executablePath:
                        PUPPETEER_EXEC_PATH !== ""
                            ? PUPPETEER_EXEC_PATH
                            : undefined
                });
                const page = await browser.newPage();

                if (users[0]["Cookies"]) {
                    await page.setCookie(...JSON.parse(users[0]["Cookies"]));
                }

                await page.goto(URL_BILLING, {
                    timeout: 5000,
                    waitUntil: ["domcontentloaded", "networkidle0"]
                });

                let newLogin;
                if (!(await page.$("#otherPanel"))) {
                    newLogin = true;

                    await page.waitForSelector("#butSignIn");
                    await page.type("#txtUserName", users[0]["Username"]);
                    await page.type(
                        "#txtPassword",
                        decodeBase64(users[0]["Password"])
                    );
                    await sleep(100);
                    await page.click("#butSignIn");
                }

                await page.waitForSelector("#otherPanel", { timeout: 3000 });

                const data = await page.$eval("tr:nth-child(2)", (el) => ({
                    scheduledHours: +el.children[2]?.textContent,
                    onlineHours: +el.children[3]?.textContent,
                    minutesWaiting: +el.children[8]?.textContent.replace(
                        /,/g,
                        ""
                    ),
                    minutesInSession: +el.children[9]?.textContent.replace(
                        /,/g,
                        ""
                    )
                }));

                res.status(200).json(data);
                const cookies = await page.cookies();
                await browser.close();

                if (newLogin) saveCookies(cookies);
            } catch (err) {
                console.error(err);
                if (!res.headersSent)
                    res.status(500).json({ message: "Internal server error" });
            }
        });
    });
}

export async function usd(_, res) {
    try {
        // start puppeteer
        const browser = await puppeteer.launch({
            executablePath:
                PUPPETEER_EXEC_PATH !== "" ? PUPPETEER_EXEC_PATH : undefined
        });
        const page = await browser.newPage();
        await page.goto(URL_USD, {
            timeout: 10000,
            waitUntil: ["domcontentloaded", "networkidle0"]
        });
        // await page.waitForNavigation();
        // await sleep(500);

        // return res.status(200).json({ message: 'ok' });

        const sel = ".YMlKec.fxKbKc";
        await page.waitForSelector(sel, { timeout: 3000 });
        const data = await page.$eval(sel, (el) => ({
            usd: +el?.textContent.replace(/,/g, "")
        }));

        res.status(200).json(data);
        await browser.close();
    } catch (err) {
        console.error(err);
        if (!res.headersSent)
            res.status(500).json({ message: "Internal server error" });
    }
}

export async function validateCredentials(req, res) {
    const { username, password } = req.body;

    if (!username || !password)
        return res
            .status(400)
            .json({ message: "Missing username or password" });

    if (username.length < 4 || password.length < 4)
        return res.status(400).json({
            message: "Username and password must be at least 4 characters long"
        });
    db.serialize(() => {
        db.all("SELECT * FROM User", async (err, users) => {
            if (err) {
                console.error(err);
                return res
                    .status(500)
                    .json({ message: "Internal server error" });
            }

            if (users.length > 1) {
                console.log("ERROR: Several users in database");
                return res
                    .status(500)
                    .json({ message: "Internal server error" });
            }

            try {
                // start puppeteer
                const browser = await puppeteer.launch({
                    executablePath:
                        PUPPETEER_EXEC_PATH !== ""
                            ? PUPPETEER_EXEC_PATH
                            : undefined
                });
                const page = await browser.newPage();

                await page.goto(URL_BILLING, {
                    timeout: 5000,
                    waitUntil: ["domcontentloaded", "networkidle0"]
                });
                // await page.waitForNavigation();
                // await sleep(1000);

                if (!(await page.$("#otherPanel"))) {
                    await page.waitForSelector("#butSignIn", { timeout: 3000 });
                    await page.type("#txtUserName", username);
                    await page.type("#txtPassword", password);
                    await sleep(100);
                    await page.click("#butSignIn");
                    // await sleep(500);
                    // await page.waitForNavigation();
                }

                try {
                    await page.waitForSelector("#otherPanel", {
                        timeout: 1000
                    });
                    res.status(200).json({ valid: true });
                } catch (err) {
                    res.status(200).json({ valid: false });
                }

                await browser.close();
            } catch (err) {
                console.error(err);
                if (!res.headersSent)
                    res.status(500).json({ message: "Internal server error" });
            }
        });
    });
}
