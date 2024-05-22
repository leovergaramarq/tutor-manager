import puppeteer from "puppeteer";
import { db } from "../config/db.config.js";
import { URL_SCHEDULE } from "../config/constants.config.js";
import { defPreferences } from "../config/preferences.config.js";
import { save as saveCookies } from "./cookies.service.js";
import { sleep } from "../helpers/utils.helper.js";
import {
    getDateFromSunday,
    getLocalTime,
    getWeekBounds
} from "../helpers/utils.helper.js";
import {
    SCHEDULE_BY_ADDING,
    SCHEDULE_BY_AREA
} from "../config/constants.config.js";
import { decodeBase64 } from "./auth.service.js";
import { PUPPETEER_EXEC_PATH } from "../config/general.config.js";

export function setSchedule() {
    console.log("Setting schedule...");
    clearInterval(intervalWeekly);
    clearTimeout(timeoutSetSched);
    clearTimeout(timeoutFinishSched);

    db.serialize(() => {
        db.all("SELECT * FROM Preference", (err, rows) => {
            if (err) {
                return console.log(
                    "Could not load preferences from database. Using default values."
                );
            }
            const preferences = rows.length ? rows[0] : defPreferences();
            console.log("Preferences", preferences);
            const {
                HourToSchedule: hourToSchedule,
                DayToSchedule: dayToSchedule,
                ScheduleAnticipation: scheduleAnticipation,
                ScheduleDelay: scheduleDelay,
                ScheduleMethod: scheduleMethod,
                SchedulePreferredHours: schedulePreferredHours,
                DeadlineMinutesToSchedule: deadlineMinutesToSchedule,
                PuppeteerHeadless: puppeteerHeadless
            } = preferences;

            const localDate = getLocalTime();
            const localDateSched = getDateToSchedule(
                localDate,
                dayToSchedule,
                hourToSchedule,
                deadlineMinutesToSchedule
            );

            const milisToSched =
                localDateSched - localDate - scheduleAnticipation;

            // clearTimeout(timeoutSetSched);
            timeoutSetSched = setTimeout(() => {
                timeoutSetSched = null;

                // clearInterval(intervalWeekly);
                intervalWeekly = setInterval(() => {
                    //reset after 7 days
                    schedule(1, localDateSched, {
                        scheduleDelay,
                        scheduleMethod,
                        schedulePreferredHours,
                        puppeteerHeadless
                    });
                }, 604800000);

                console.log(
                    `Unwanted delay: ${(new Date() - localDate) / 1000}s`
                );
                schedule(1, localDateSched, {
                    scheduleDelay,
                    scheduleMethod,
                    schedulePreferredHours,
                    puppeteerHeadless
                });
            }, milisToSched);

            if (milisToSched <= 0) {
                console.log("Scheduling now...");
            } else {
                const days = milisToSched / 86400000;
                const hours = (days - Math.floor(days)) * 24;
                const minutes = (hours - Math.floor(hours)) * 60;
                console.log(
                    `Scheduling will take place within ${Math.floor(
                        days
                    )} days, ${Math.floor(hours)} hours, ${minutes.toFixed(
                        2
                    )} minutes.`
                );
            }
        });
    });
}

// week = 0 for this week, 1 for next week
export async function schedule(
    week = 1,
    localDateSched,
    preferences,
    callback
) {
    console.log(
        getLocalTime().toLocaleTimeString(),
        "-",
        "Start schedule method"
    );
    if (week < 0 || week > 1) {
        const msg = "Invalid week.";
        console.log(msg);
        if (callback) callback(400, msg);
        return;
    }

    console.log(
        `Scheduling ${week === 0 ? "for current week" : "for next week"}...`
    );
    clearTimeout(timeoutFinishSched);

    db.serialize(() => {
        db.all("SELECT * FROM User", async (err, users) => {
            if (err) {
                console.error(err);
                return res
                    .status(500)
                    .json({ message: "Internal server error" });
            }
            if (users.length !== 1) {
                const msg = "User not found.";
                console.log(msg);
                console.log("Users found: " + users.length);
                if (callback) callback(401, msg);
                return;
            }
            console.log(
                getLocalTime().toLocaleTimeString(),
                "-",
                "Database User query successful."
            );
            const { scheduleDelay, scheduleMethod, schedulePreferredHours } =
                preferences;

            db.all(
                schedulePreferredHours
                    ? "SELECT * FROM PreferredHour"
                    : "SELECT * FROM Hour",
                async (err, hours) => {
                    if (err) {
                        console.error(err);
                        return res
                            .status(500)
                            .json({ message: "Internal server error" });
                    }
                    console.log(
                        getLocalTime().toLocaleTimeString(),
                        "-",
                        "Database Hour query successful."
                    );
                    let localDate = getLocalTime();
                    const [sunday, saturday] = getWeekBounds(
                        new Date(localDate.getTime() + week * 604800000)
                    ); // 604800000 = 7 days in case week is 1

                    // filter hours by week and greater than now if schedulePreferredHours is false (using table Hour)
                    if (schedulePreferredHours === 0) {
                        hours = hours.filter(({ Year, Month, Day, Hour }) => {
                            const hourToSched = hourToDate(
                                Year,
                                Month,
                                Day,
                                Hour
                            );
                            return (
                                hourToSched >= sunday &&
                                hourToSched <= saturday &&
                                hourToSched >= localDate
                            );
                        });
                    } else {
                        // filter hours greater than now if schedulePreferredHours is true (using table PreferredHour)
                        hours = hours.filter(({ Day, Hour }) => {
                            if (week !== 0) return true;
                            const nowDay = localDate.getDay() % 7;
                            if (Day > nowDay) return true;
                            if (Day < nowDay) return false;
                            return Hour > localDate.getHours();
                        });
                    }
                    console.log(
                        getLocalTime().toLocaleTimeString(),
                        "-",
                        "Hours filtered."
                    );
                    if (!hours.length) {
                        const msg = "No hours found.";
                        console.log(msg);
                        if (callback) callback(404, msg);
                        return;
                    }

                    console.log("hours to schedule", hours);

                    const hoursDate = hours.map(({ Year, Month, Day, Hour }) =>
                        hourToDate(Year, Month, Day, Hour, sunday)
                    );

                    const cells = hours.map(({ Year, Month, Day, Hour }) =>
                        hourToCell(Year, Month, Day, Hour)
                    );
                    console.log(
                        getLocalTime().toLocaleTimeString(),
                        "-",
                        "Cells calculated."
                    );
                    try {
                        // start puppeteer
                        const browser = await puppeteer.launch({
                            executablePath:
                                PUPPETEER_EXEC_PATH !== ""
                                    ? PUPPETEER_EXEC_PATH
                                    : undefined,
                            defaultViewport: null,
                            args: [
                                "--force-device-scale-factor=0.8",
                                "--disable-infobars"
                            ],
                            headless: preferences.puppeteerHeadless
                                ? true
                                : false
                        });
                        console.log(
                            getLocalTime().toLocaleTimeString(),
                            "-",
                            "Puppeteer launched."
                        );
                        const page = await browser.newPage();
                        if (users[0]["Cookies"]) {
                            await page.setCookie(
                                ...JSON.parse(users[0]["Cookies"])
                            );
                        }
                        console.log(
                            getLocalTime().toLocaleTimeString(),
                            "-",
                            "Page created."
                        );
                        await page.goto(URL_SCHEDULE, {
                            timeout: 5000,
                            waitUntil: ["domcontentloaded", "networkidle0"]
                        });
                        console.log(
                            getLocalTime().toLocaleTimeString(),
                            "-",
                            "Page loaded."
                        );
                        let newLogin;

                        // if need to login again
                        if (!(await page.$("#lblAvailableHours"))) {
                            console.log("Logging in again...");
                            await page.waitForSelector("#butSignIn", {
                                timeout: 3000
                            });
                            await page.type(
                                "#txtUserName",
                                users[0]["Username"]
                            );
                            await page.type(
                                "#txtPassword",
                                decodeBase64(users[0]["Password"])
                            );
                            await sleep(100);
                            await Promise.all([
                                page.click("#butSignIn"),
                                page.waitForNavigation({
                                    waitUntil: [
                                        "domcontentloaded",
                                        "networkidle0"
                                    ],
                                    timeout: 3000
                                })
                            ]);
                            newLogin = true;
                        }

                        await page.waitForSelector('[name="weekAhead"]', {
                            timeout: 3000
                        });

                        if (week === 1) {
                            await Promise.all([
                                page.click('[name="weekAhead"]'),
                                page.waitForNavigation({
                                    waitUntil: [
                                        "domcontentloaded",
                                        "networkidle0"
                                    ],
                                    timeout: 3000
                                })
                            ]);
                        }

                        localDate = getLocalTime();

                        if (localDateSched > localDate) {
                            console.log(
                                localDate.toLocaleTimeString(),
                                "-",
                                (localDateSched - localDate + scheduleDelay) /
                                    1000,
                                "seconds to schedule (with delay)"
                            );

                            clearTimeout(timeoutFinishSched);
                            const wtfTimeout = 2000;

                            // wait for the hour to schedule
                            timeoutFinishSched = setTimeout(async () => {
                                console.log(
                                    getLocalTime().toLocaleTimeString(),
                                    "-",
                                    "Now!"
                                );

                                timeoutFinishSched = null;
                                // reload page
                                await page.reload({
                                    waitUntil: [
                                        "domcontentloaded",
                                        "networkidle0"
                                    ],
                                    timeout: 3000
                                });

                                console.log(
                                    getLocalTime().toLocaleTimeString(),
                                    "-",
                                    "Now! x2"
                                );
                                await finishSchedule(
                                    page,
                                    hours,
                                    hoursDate,
                                    cells,
                                    scheduleMethod,
                                    newLogin,
                                    callback
                                );
                            }, localDateSched - localDate + scheduleDelay - wtfTimeout);
                        } else {
                            // schedule immediately
                            await finishSchedule(
                                page,
                                hours,
                                hoursDate,
                                cells,
                                scheduleMethod,
                                newLogin,
                                callback
                            );
                        }

                        // await page.close();
                        // await browser.close();
                    } catch (err) {
                        console.error(err);
                        if (callback) callback(500, "Internal server error.");
                    }
                }
            );
        });
    });
}

async function finishSchedule(
    page,
    hours,
    hoursDate,
    cells,
    scheduleMethod,
    newLogin,
    callback
) {
    try {
        // await page.waitForSelector("#lblAvailableHours", { timeout: 3000 });
        let hoursAvailable = await getHoursAvailable(page);

        if (!hoursAvailable) {
            console.log("No available hours. Reloading...");
            await page.reload({
                waitUntil: ["domcontentloaded", "networkidle0"],
                timeout: 3000
            });
            // await page.waitForSelector("#lblAvailableHours", { timeout: 3000 });
            hoursAvailable = await getHoursAvailable(page);
        }

        if (!hoursAvailable) {
            const msg = "No available hours.";
            if (callback) callback(404, msg);
            console.log(msg);

            page.evaluate(() => {
                window.alert("No available hours.");
            }).catch(console.error);
        } else {
            await page.evaluate(() => {
                window.alertOriginal = window.alert;
                window.alert = () => {};
            });

            const count =
                scheduleMethod === SCHEDULE_BY_ADDING
                    ? await scheduleByAdding(page, hours, cells)
                    : scheduleMethod === SCHEDULE_BY_AREA
                    ? await scheduleByArea(
                          page,
                          hours,
                          hoursDate,
                          cells,
                          hoursAvailable
                      )
                    : 0;

            page.evaluate(() => {
                window.alert = window.alertOriginal;
                window.alert("Scheduling finished.");
            }).catch(console.error);

            const msg = `Scheduled ${count}/${hours.length} hours.`;
            if (callback) callback(200, msg);
            console.log(msg);
        }

        if (newLogin) saveCookies(await page.cookies()).catch(console.error);
    } catch (err) {
        console.error(err);
    }
}

async function scheduleByAdding(page, hours, cells) {
    let count = 0;

    const selectToSchedule = async (i) => {
        try {
            await page.click(`#cell${cells[i]}`);
        } catch (err) {
            console.error(err);
        }
    };

    try {
        // await page.waitForSelector("#cell0");

        await selectToSchedule(0);
        const { keyboard } = page;
        await keyboard.down("Control"); // hold control to select multiple hours
        for (let i = 1; i < hours.length; i++) {
            await selectToSchedule(i);
        }
        await keyboard.up("Control");
        const available = await page.$eval(
            "#butProviderSchedule",
            (el) => !el.disabled
        );
        if (available) {
            await page.click("#butProviderSchedule");
            await waitForScheduleButton(page, 10000);
        }

        console.log("looking for scheduled hours...");
        const scheduled = await page.evaluate(() =>
            [...document.querySelectorAll(".ui-selecting-finished-FILLED")].map(
                (el) => el.id
            )
        );
        console.log("scheduled", scheduled);
        scheduled.forEach(
            (id) => cells.includes(+id.split("cell")[1]) && count++
        );
    } catch (err) {
        console.error(err);
    }
    return count;
}

async function scheduleByArea(page, hours, hoursDate, cells, hoursAvailable) {
    console.log("Please do not hover over the interface"); // otherwise drag and drop will not work
    let count = 0;

    let { cellFrom, cellTo } = getCellsForAreaSchedule(hours);

    // await page.waitForSelector("#cell0");

    const getScheduledHours = () =>
        [...document.querySelectorAll(".ui-selecting-finished-FILLED")].map(
            (el) => el.id
        );

    try {
        // schedule the whole week simulating drag and drop
        const { mouse } = page;

        const date = new Date();
        const dayNow = date.getDay() % 7;
        const hoursNow = date.getHours();

        let didAvoidNextDay = false;
        if (cellFrom % 7 === dayNow || cellFrom % 7 === (dayNow + 1) % 7) {
            // if the first hour to schedule is today or tomorrow, move it to day after tomorrow
            didAvoidNextDay = true;
            if (cellFrom % 7 === dayNow) {
                cellFrom += 2;
            } else {
                cellFrom += 1;
            }
        }

        // find hours already scheduled
        const previouslyScheduled = await page.evaluate(getScheduledHours);
        console.log("previouslyScheduled", previouslyScheduled);

        const scheduleArea = async (cellFrom, cellTo) => {
            const selCellFrom = `#cell${cellFrom}`;
            // await page.waitForSelector(selCellFrom);
            const $cellFrom = await page.$(selCellFrom); // if saturday, area should not cover sundays

            const selCellTo = `#cell${cellTo}`;
            // await page.waitForSelector(selCellTo);
            const $cellTo = await page.$(selCellTo);

            const boxFrom = await $cellFrom.boundingBox();
            const boxTo = await $cellTo.boundingBox();

            await mouse.move(
                boxFrom.x + boxFrom.width / 2,
                boxFrom.y + boxFrom.height / 2
            );
            await mouse.down();
            await mouse.move(
                boxTo.x + boxTo.width / 2,
                boxTo.y + boxTo.height / 2
            );
            await mouse.up();

            const available = await page.$eval(
                "#butProviderSchedule",
                (el) => !el.disabled
            );

            if (available) {
                await page.click("#butProviderSchedule");
                await waitForScheduleButton(page, 10000);
            }
        };

        if (cellFrom % 7 <= cellTo % 7) {
            // cellFrom must be in the same day as cellTo or before
            await scheduleArea(cellFrom, cellTo);
        } else {
            console.log("Cannot schedule by area");
        }

        if (didAvoidNextDay) {
            // if there are unscheduled hours on tomorrow, schedule them
            const cellFrom = ((hoursNow + 1) % 24) * 7 + ((dayNow + 1) % 7);
            const cellTo = 23 * 7 + ((dayNow + 1) % 7);
            if (
                cells.some(
                    (cell) => cell % 7 === cellFrom % 7 && cell >= cellFrom
                )
            ) {
                await scheduleArea(cellFrom, cellTo);
            }
        }

        // unschedule the unwanted hours
        const scheduled = await page.evaluate(getScheduledHours); // get the hours scheduled after step 1
        console.log("scheduled so far", scheduled);

        const toUnschedule = scheduled.filter((id) => {
            // skip hours previously scheduled
            if (previouslyScheduled.includes(id)) return false;

            // skip sundays if saturday
            const cellNum = +id.split("cell")[1];
            const day = cellNum % 7;
            const hour = Math.floor(cellNum / 7);
            if (
                day === dayNow ||
                (day === (dayNow + 1) % 7 && hour <= hoursNow)
            )
                return false; // skip unscheduling if less than 24 hours from now

            // avoid unscheduling hours that the user wants to schedule
            const hourWanted = hours.find(
                ({ Hour }, i) =>
                    hoursDate[i].getDay() % 7 === day && Hour === hour
            );
            if (hourWanted) hourWanted.scheduled = true; // mark as scheduled
            return !hourWanted;
        });
        console.log("toUnschedule", toUnschedule);

        let toSchedule = hours.filter((hour) => !hour.scheduled);
        count = hours.length - toSchedule.length;

        const unschedule = async (unscheduleCountLimit) => {
            if (!toUnschedule.length) return;

            const selectToUnschedule = async (i) => {
                try {
                    await page.click(`#${toUnschedule[i]}`);
                } catch (err) {
                    console.log(err.message);
                }
            };

            await selectToUnschedule(0); // select first hour to undo previous selection
            const { keyboard } = page;
            await keyboard.down("Control"); // hold control to select multiple hours
            for (let i = 1; i < toUnschedule.length; i++) {
                if (i >= unscheduleCountLimit) break;
                await selectToUnschedule(i);
            }
            await keyboard.up("Control");

            await page.click("#butProviderUnschedule");
            await waitForScheduleButton(page, 10000);
        };

        if (toSchedule.length && count < hoursAvailable) {
            let unscheduleCountLimit =
                scheduled.length + toSchedule.length - hoursAvailable;

            if (unscheduleCountLimit > 0 && toUnschedule.length) {
                await unschedule(unscheduleCountLimit);
            }

            // schedule the missing hours
            console.log("Scheduling the missing hours...");
            const cellsToSchedule = toSchedule.map(
                ({ Year, Month, Day, Hour }) =>
                    hourToCell(Year, Month, Day, Hour)
            );
            count += await scheduleByAdding(page, toSchedule, cellsToSchedule);
        }

        await unschedule();
    } catch (err) {
        console.error(err);
    }

    return count;
}

async function waitForScheduleButton(page, timeout = 30000) {
    try {
        await page.waitForFunction(
            () =>
                !document.querySelector("#butProviderSchedule").disabled ||
                !document.querySelector("#butProviderUnschedule").disabled, // wait for either button to be enabled
            { timeout }
        );
        // console.log(`Waiting ${timeout / 1000} seconds for buttons...`);
    } catch (err) {
        console.log("Buttons not enabled");
    }
}

function getHoursAvailable(page) {
    return (
        page.evaluate(
            () =>
                +document.querySelector("#lblAvailableHours")?.textContent -
                +document.querySelector("#lblScheduledHours")?.textContent
        ) || 0
    );
}

function getDateToSchedule(
    date,
    dayToSchedule,
    hourToSchedule,
    deadlineMinutesToSchedule
) {
    const day = date.getDate() + ((dayToSchedule - date.getDay() + 7) % 7);
    const hour = hourToSchedule;

    const dateSched = new Date(date);
    dateSched.setDate(day);
    dateSched.setHours(hour, 48, 0, 0);

    if ((date - dateSched) / 60000 > deadlineMinutesToSchedule) {
        // if the hour to schedule is in the past, schedule for next week
        dateSched.setDate(dateSched.getDate() + 7);
    }

    return dateSched;
}

function getCellsForAreaSchedule(hours) {
    const minHour = Math.min(...hours.map(({ Hour }) => Hour));
    const maxHour = Math.max(...hours.map(({ Hour }) => Hour));

    const dates = hours.map(({ Year, Month, Day, Hour }) =>
        hourToDate(Year, Month, Day, Hour)
    );
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));

    const cellFrom = hourToCell(
        minDate.getFullYear(),
        minDate.getMonth() + 1,
        minDate.getDate(),
        minHour
    );

    const cellTo = hourToCell(
        maxDate.getFullYear(),
        maxDate.getMonth() + 1,
        maxDate.getDate(),
        maxHour
    );

    return { cellFrom, cellTo };
}

function hourToCell(Year, Month, Day, Hour) {
    const cell =
        (Year !== undefined
            ? hourToDate(Year, Month, Day, Hour).getDay()
            : Day) +
        7 * Hour;
    return cell;
}

function hourToDate(Year, Month, Day, Hour, sunday) {
    return Year !== undefined
        ? new Date(`${Year}/${Month}/${Day} ${Hour}:00`)
        : getDateFromSunday(sunday, Day, Hour);
}

function clearInterval(interval) {
    if (interval) {
        global.clearInterval(interval);
        interval = null;
    }
}

function clearTimeout(timeout) {
    if (timeout) {
        global.clearTimeout(timeout);
        timeout = null;
    }
}

let timeoutSetSched, intervalWeekly, timeoutFinishSched;
