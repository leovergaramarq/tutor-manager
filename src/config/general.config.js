import prompts from "prompts";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { __dirname } from "./constants.config.js";

// preferences
export const DEADLINE_MINUTES_TO_SCHEDULE = 60; // schedule if 60 mimnutes have not passed since the hour
export const PUPPETEER_HEADLESS = 0; // 0 = no, 1 = yes
export const HOUR_TO_SCHEDULE = 12;
export const DAY_TO_SCHEDULE = 6;
export const SCHEDULE_ANTICIPATION = 60000; // begin scrapping 1 minute before the hour
export const SCHEDULE_DELAY = 500; // schedule 1 second after the hour (to avoid scheduling conflicts)
export const SCHEDULE_METHOD = 0; // 0 = adding, 1 = area
export const SCHEDULE_PREFERRED_HOURS = 0; // 0 = no (use table Hour), 1 = yes (use table PreferredHour)
export const LOW_SEASON = 0; // 0 = no, 1 = yes

export let PORT;
export let PUPPETEER_EXEC_PATH;
export let TIME_DIFF = 0;
export const NODE_ENV = process.env.NODE_ENV || "production";
process.env.TZ = "America/New_York";
// process.env.TZ = 'Europe/Madrid'; // for testing

export function config(newConfig) {
    const pathEnv = path.join(__dirname, ".env");

    if (newConfig && Object.keys(newConfig).length) {
        const { port, puppeteerExecPath } = newConfig;
        const dataList = [];

        if (port !== undefined) dataList.push(`PORT="${port}"`);
        if (puppeteerExecPath !== undefined)
            dataList.push(`PUPPETEER_EXEC_PATH="${puppeteerExecPath}"`);

        const data = dataList.join("\n");

        try {
            fs.writeFileSync(pathEnv, data);
        } catch (err) {
            console.error(err);
        }
    }

    dotenv.config({ path: pathEnv });
    PORT = process.env.PORT;
    PUPPETEER_EXEC_PATH = process.env.PUPPETEER_EXEC_PATH;
}

export async function promptPort() {
    const { port } = await prompts({
        type: "number",
        name: "port",
        message: "Enter port number",
        initial: 5000
    });
    return port;
}

export async function promptPuppeteerExecPath() {
    const { puppeteerExecPath } = await prompts({
        type: "text",
        name: "puppeteerExecPath",
        message:
            'Enter puppeteer executable path (leave empty to use default "C:\\Users\\<your_user>\\.cache\\puppeteer")',
        initial: ""
    });
    return puppeteerExecPath.trim();
}

export function configTimeDiff(timeDiff) {
    TIME_DIFF = timeDiff;
}

config();
