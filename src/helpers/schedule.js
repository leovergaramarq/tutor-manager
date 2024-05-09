import puppeteer from "puppeteer";
import sqlite3 from "sqlite3";
import { DB_PATH, URL_SCHEDULE } from "../constants.js";
import { defPreferences } from "./preferences.js";
import { save as saveCookies } from "./cookies.js";
import sleep from "./sleep.js";
import { getDateFromSunday, getLocalTime, getWeekBounds } from "./week.js";
import { SCHEDULE_BY_ADDING, SCHEDULE_BY_AREA } from "../config.js";

export default function setSchedule() {
    console.log("Setting schedule...");
    clearInterval(intervalWeekly);
    clearTimeout(timeoutSetSched);
    clearTimeout(timeoutFinishSched);

    // getCellsForAreaSchedule(SCHEDULE_BY_AREA, [
    //     { HourID: 2, Year: 2024, Month: 5, Day: 8, Hour: 9 },
    //     { HourID: 4, Year: 2024, Month: 5, Day: 10, Hour: 10 },
    //     { HourID: 5, Year: 2024, Month: 5, Day: 9, Hour: 7 },
    //     { HourID: 6, Year: 2024, Month: 5, Day: 9, Hour: 12 }
    // ]); // test

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

            const date = getLocalTime();
            const dateSched = getDateToSchedule(
                date,
                dayToSchedule,
                hourToSchedule,
                deadlineMinutesToSchedule
            );

            const milisToSched = dateSched - date - scheduleAnticipation;

            // clearTimeout(timeoutSetSched);
            timeoutSetSched = setTimeout(() => {
                timeoutSetSched = null;

                // clearInterval(intervalWeekly);
                intervalWeekly = setInterval(() => {
                    //reset after 7 days
                    schedule(1, dateSched, {
                        scheduleDelay,
                        scheduleMethod,
                        schedulePreferredHours,
                        puppeteerHeadless
                    });
                }, 604800000);

                console.log(`Unwanted delay: ${(new Date() - date) / 1000}s`);
                schedule(1, dateSched, {
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
export async function schedule(week = 1, dateSched, preferences, callback) {
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
                console.log(err);
                return res.status(500).json({ message: err.message });
            }
            if (users.length !== 1) {
                const msg = "User not found.";
                console.log(msg);
                console.log("Users found: " + users.length);
                if (callback) callback(401, msg);
                return;
            }

            const { scheduleDelay, scheduleMethod, schedulePreferredHours } =
                preferences;

            db.all(
                schedulePreferredHours
                    ? "SELECT * FROM PreferredHour"
                    : "SELECT * FROM Hour",
                async (err, hours) => {
                    if (err) {
                        console.log(err);
                        return res.status(500).json({ message: err.message });
                    }
                    // console.log(hours);
                    // get hours for the week
                    const now = new Date();
                    const [sunday, saturday] = getWeekBounds(
                        new Date(now.getTime() + week * 604800000)
                    ); // 604800000 = 7 days in case week is 1
                    // console.log("all hours", hours);

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
                                hourToSched >= now
                            );
                        });
                    } else {
                        // filter hours greater than now if schedulePreferredHours is true (using table PreferredHour)
                        hours = hours.filter(({ Day, Hour }) => {
                            if (week !== 0) return true;
                            const nowDay = now.getDay() % 7;
                            if (Day > nowDay) return true;
                            if (Day < nowDay) return false;
                            return Hour > now.getHours();
                        });
                    }

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

                    try {
                        // start puppeteer
                        const browser = await puppeteer.launch({
                            args: ["--force-device-scale-factor=0.8"],
                            headless: preferences.puppeteerHeadless
                                ? true
                                : false
                        });
                        const page = await browser.newPage();
                        if (users[0].Cookies) {
                            await page.setCookie(
                                ...JSON.parse(users[0].Cookies)
                            );
                        }
                        await page.goto(URL_SCHEDULE, { timeout: 0 });
                        // await page.waitForNavigation();
                        await sleep(1000);

                        let newLogin;
                        if (!(await page.$("#lblAvailableHours"))) {
                            // if need to login again
                            console.log("Logging in again...");
                            await page.waitForSelector("#butSignIn");
                            await page.type("#txtUserName", users[0].Username);
                            await page.type("#txtPassword", users[0].Password);
                            await sleep(100);
                            await page.click("#butSignIn");
                            newLogin = true;
                            // await page.waitForNavigation();
                        }

                        // if(callback) callback(200, 'Scheduling...'); // if scheduling takes too long, the connection will be closed

                        if (dateSched) {
                            // wait for the hour to schedule
                            const date = new Date();

                            // clearTimeout(timeoutFinishSched);
                            timeoutFinishSched = setTimeout(async () => {
                                timeoutFinishSched = null;
                                if (week === 1) {
                                    // if next week, click next week button
                                    await page.waitForSelector(
                                        '[name="weekAhead"]'
                                    );
                                    // await sleep(500);
                                    await page.click('[name="weekAhead"]');
                                    // await page.waitForNavigation();
                                    await sleep(100);
                                } else {
                                    // otherwise, reload page
                                    await page.reload({
                                        waitUntil: [
                                            "networkidle0",
                                            "domcontentloaded"
                                        ]
                                    });
                                }
                                finishSchedule(
                                    page,
                                    hours,
                                    hoursDate,
                                    cells,
                                    scheduleMethod,
                                    newLogin,
                                    callback
                                );
                            }, dateSched - date + scheduleDelay);
                        } else {
                            // schedule immediately
                            if (week === 1) {
                                // if next week, click next week button
                                await page.waitForSelector(
                                    '[name="weekAhead"]'
                                );
                                // await sleep(500);
                                await page.click('[name="weekAhead"]');
                                // await page.waitForNavigation();
                                await sleep(100);
                            }

                            finishSchedule(
                                page,
                                hours,
                                hoursDate,
                                cells,
                                scheduleMethod,
                                newLogin,
                                callback
                            );
                        }
                    } catch (err) {
                        console.log(err);
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
        await page.evaluate(() => {
            window.alertOriginal = window.alert;
            window.alert = () => {};
        });

        await page.waitForSelector("#lblAvailableHours"); // wait for the page to load
        const hoursAvailable = await getHoursAvailable(page);
        if (!hoursAvailable) {
            const msg = "No hours available.";
            if (callback) callback(404, msg);
            console.log(msg);
        } else {
            const count =
                scheduleMethod === SCHEDULE_BY_ADDING
                    ? await scheduleByAdding(page, hours, cells)
                    : await scheduleByArea(
                          page,
                          hours,
                          hoursDate,
                          cells,
                          hoursAvailable
                      );
            const msg = `Scheduled ${count}/${hours.length} hours.`;
            if (callback) callback(200, msg);
            console.log(msg);
        }

        if (newLogin) saveCookies(await page.cookies());
        await page.evaluate(() => {
            window.alert = window.alertOriginal;
            window.alert("Scheduling finished.");
        });
    } catch (err) {
        // TODO: should call callback?
        console.log(err);
    }
}

async function scheduleByAdding(page, hours, cells) {
    let count = 0;

    const selectToSchedule = async (i) => {
        try {
            await page.click(`#cell${cells[i]}`);
        } catch (err) {
            console.log(err);
        }
    };

    try {
        await page.waitForSelector("#cell0");

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
        console.log(err);
    }
    return count;
}

async function scheduleByArea(page, hours, hoursDate, cells, hoursAvailable) {
    console.log("Please do not hover over the interface"); // otherwise drag and drop will not work
    let count = 0;

    const { cellFrom, cellTo } = getCellsForAreaSchedule(hours);

    await page.waitForSelector("#cell0");

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
        console.log(err);
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
    return page.evaluate(
        () =>
            +document.querySelector("#lblAvailableHours").textContent -
            +document.querySelector("#lblScheduledHours").textContent
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
    dateSched.setHours(hour, 0, 0, 0);

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

const db = new (sqlite3.verbose().Database)(DB_PATH);
let timeoutSetSched, intervalWeekly, timeoutFinishSched;
