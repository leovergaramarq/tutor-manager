import sqlite3 from "sqlite3";
import setSchedule from "../../helpers/schedule.js";
import { DB_PATH } from "../../constants.js";
import {
    DAY_TO_SCHEDULE,
    HOUR_TO_SCHEDULE,
    SCHEDULE_ANTICIPATION,
    SCHEDULE_DELAY,
    SCHEDULE_METHOD,
    SCHEDULE_PREFERRED_HOURS,
    DEADLINE_MINUTES_TO_SCHEDULE,
    PUPPETEER_HEADLESS
} from "../../config.js";

export function get(req, res) {
    db.serialize(() => {
        db.all("SELECT * FROM Preference", (err, rows) => {
            if (err) {
                console.log(err);
                return res
                    .status(500)
                    .json({ message: "Internal server error" });
            }
            if (!rows.length) {
                return res.status(404).json({ message: "Not found" });
            }
            res.status(200).json(rows[0]);
        });
    });
}

export function upsert(req, res) {
    let {
        hourToSchedule,
        dayToSchedule,
        scheduleAnticipation,
        scheduleDelay,
        scheduleMethod,
        schedulePreferredHours,
        deadlineMinutesToSchedule,
        puppeteerHeadless
    } = req.body;

    if (!Object.keys(req.body).length) {
        return res.status(400).json({ message: "Bad request" });
    }

    if (
        hourToSchedule !== undefined &&
        (hourToSchedule < 0 || hourToSchedule > 23)
    ) {
        return res.status(400).json({ message: "Invalid hour" });
    }

    if (
        dayToSchedule !== undefined &&
        (dayToSchedule < 0 || dayToSchedule > 6)
    ) {
        return res.status(400).json({ message: "Invalid day" });
    }

    if (scheduleAnticipation !== undefined && scheduleAnticipation < 0) {
        return res.status(400).json({ message: "Invalid anticipation" });
    }

    if (scheduleDelay !== undefined && scheduleDelay < 0) {
        return res.status(400).json({ message: "Invalid delay" });
    }

    if (
        scheduleMethod !== undefined &&
        (scheduleMethod < 0 || scheduleMethod > 1)
    ) {
        return res.status(400).json({ message: "Invalid method" });
    }

    if (
        schedulePreferredHours !== undefined &&
        (schedulePreferredHours < 0 || schedulePreferredHours > 1)
    ) {
        return res.status(400).json({ message: "Invalid preferred hours" });
    }

    if (
        deadlineMinutesToSchedule !== undefined &&
        deadlineMinutesToSchedule < 0
    ) {
        return res.status(400).json({ message: "Invalid deadline" });
    }

    if (
        puppeteerHeadless !== undefined &&
        (puppeteerHeadless < 0 || puppeteerHeadless > 1)
    ) {
        return res.status(400).json({ message: "Invalid headless" });
    }

    db.serialize(() => {
        db.all("SELECT * FROM Preference", (err, rows) => {
            if (err) {
                console.log(err);
                return res
                    .status(500)
                    .json({ message: "Internal server error" });
            }
            if (!rows.length) {
                if (hourToSchedule === undefined)
                    hourToSchedule = HOUR_TO_SCHEDULE;
                if (dayToSchedule === undefined)
                    dayToSchedule = DAY_TO_SCHEDULE;
                if (scheduleAnticipation === undefined)
                    scheduleAnticipation = SCHEDULE_ANTICIPATION;
                if (scheduleDelay === undefined) scheduleDelay = SCHEDULE_DELAY;
                if (scheduleMethod === undefined)
                    scheduleMethod = SCHEDULE_METHOD;
                if (schedulePreferredHours === undefined)
                    schedulePreferredHours = SCHEDULE_PREFERRED_HOURS;
                if (deadlineMinutesToSchedule === undefined)
                    deadlineMinutesToSchedule = DEADLINE_MINUTES_TO_SCHEDULE;
                if (puppeteerHeadless === undefined)
                    puppeteerHeadless = PUPPETEER_HEADLESS;

                db.run(
                    `INSERT INTO Preference (HourToSchedule, DayToSchedule, ScheduleAnticipation, ScheduleDelay, ScheduleMethod, SchedulePreferredHours, DeadlineMinutesToSchedule, PuppeteerHeadless) VALUES (${hourToSchedule}, ${dayToSchedule}, ${scheduleAnticipation}, ${scheduleDelay}, ${scheduleMethod}, ${schedulePreferredHours}, ${deadlineMinutesToSchedule}, ${puppeteerHeadless})`,
                    (err) => {
                        if (err) {
                            console.log(err);
                            return res
                                .status(500)
                                .json({ message: "Internal server error" });
                        }
                        res.status(200).json({ message: "Preference created" });
                        setSchedule();
                    }
                );
            } else if (rows.length > 1) {
                db.run("DELETE FROM Preference", (err) => {
                    if (err) {
                        console.log(err);
                        return res
                            .status(500)
                            .json({ message: "Internal server error" });
                    }
                    if (hourToSchedule === undefined)
                        hourToSchedule = HOUR_TO_SCHEDULE;
                    if (dayToSchedule === undefined)
                        dayToSchedule = DAY_TO_SCHEDULE;
                    if (scheduleAnticipation === undefined)
                        scheduleAnticipation = SCHEDULE_ANTICIPATION;
                    if (scheduleDelay === undefined)
                        scheduleDelay = SCHEDULE_DELAY;
                    if (scheduleMethod === undefined)
                        scheduleMethod = SCHEDULE_METHOD;
                    if (schedulePreferredHours === undefined)
                        schedulePreferredHours = SCHEDULE_PREFERRED_HOURS;
                    if (deadlineMinutesToSchedule === undefined)
                        deadlineMinutesToSchedule =
                            DEADLINE_MINUTES_TO_SCHEDULE;
                    if (puppeteerHeadless === undefined)
                        puppeteerHeadless = PUPPETEER_HEADLESS;

                    db.run(
                        `INSERT INTO Preference (HourToSchedule, DayToSchedule, ScheduleAnticipation, ScheduleDelay, ScheduleMethod, SchedulePreferredHours, DeadlineMinutesToSchedule, PuppeteerHeadless) VALUES (${hourToSchedule}, ${dayToSchedule}, ${scheduleAnticipation}, ${scheduleDelay}, ${scheduleMethod}, ${schedulePreferredHours}, ${deadlineMinutesToSchedule}, ${puppeteerHeadless})`,
                        (err) => {
                            if (err) {
                                console.log(err);
                                return res
                                    .status(500)
                                    .json({ message: "Internal server error" });
                            }
                            res.status(200).json({
                                message: "Preference created"
                            });
                            setSchedule();
                        }
                    );
                });
            } else {
                if (hourToSchedule === undefined)
                    hourToSchedule = rows[0].HourToSchedule;
                if (dayToSchedule === undefined)
                    dayToSchedule = rows[0].DayToSchedule;
                if (scheduleAnticipation === undefined)
                    scheduleAnticipation = rows[0].ScheduleAnticipation;
                if (scheduleDelay === undefined)
                    scheduleDelay = rows[0].ScheduleDelay;
                if (scheduleMethod === undefined)
                    scheduleMethod = rows[0].ScheduleMethod;
                if (schedulePreferredHours === undefined)
                    schedulePreferredHours = rows[0].SchedulePreferredHours;
                if (deadlineMinutesToSchedule === undefined)
                    deadlineMinutesToSchedule =
                        rows[0].DeadlineMinutesToSchedule;
                if (puppeteerHeadless === undefined)
                    puppeteerHeadless = rows[0].PuppeteerHeadless;

                db.run(
                    `UPDATE Preference SET HourToSchedule = ${hourToSchedule}, DayToSchedule = ${dayToSchedule}, ScheduleAnticipation = ${scheduleAnticipation}, ScheduleDelay = ${scheduleDelay}, ScheduleMethod = ${scheduleMethod}, SchedulePreferredHours = ${schedulePreferredHours}, DeadlineMinutesToSchedule = ${deadlineMinutesToSchedule}, PuppeteerHeadless = ${puppeteerHeadless}`,
                    (err) => {
                        if (err) {
                            console.log(err);
                            return res
                                .status(500)
                                .json({ message: "Internal server error" });
                        }
                        res.status(200).json({ message: "Preference updated" });
                        setSchedule();
                    }
                );
            }
        });
    });
}

export function reset(req, res) {
    db.serialize(() => {
        db.all("SELECT * FROM Preference", (err, rows) => {
            if (err) {
                console.log(err);
                return res
                    .status(500)
                    .json({ message: "Internal server error" });
            }
            if (!rows.length) {
                db.run(
                    `INSERT INTO Preference (HourToSchedule, DayToSchedule, ScheduleAnticipation, ScheduleDelay, ScheduleMethod, SchedulePreferredHours, DeadlineMinutesToSchedule, PuppeteerHeadless) VALUES (${HOUR_TO_SCHEDULE}, ${DAY_TO_SCHEDULE}, ${SCHEDULE_ANTICIPATION}, ${SCHEDULE_DELAY}, ${SCHEDULE_METHOD}, ${SCHEDULE_PREFERRED_HOURS}, ${DEADLINE_MINUTES_TO_SCHEDULE}, ${PUPPETEER_HEADLESS})`,
                    (err) => {
                        if (err) {
                            console.log(err);
                            return res
                                .status(500)
                                .json({ message: "Internal server error" });
                        }
                        res.status(200).json({ message: "Preference created" });
                        setSchedule();
                    }
                );
            } else if (rows.length > 1) {
                db.run("DELETE FROM Preference", (err) => {
                    if (err) {
                        console.log(err);
                        return res
                            .status(500)
                            .json({ message: "Internal server error" });
                    }
                    db.run(
                        `INSERT INTO Preference (HourToSchedule, DayToSchedule, ScheduleAnticipation, ScheduleDelay, ScheduleMethod, SchedulePreferredHours, DeadlineMinutesToSchedule, PuppeteerHeadless) VALUES (${HOUR_TO_SCHEDULE}, ${DAY_TO_SCHEDULE}, ${SCHEDULE_ANTICIPATION}, ${SCHEDULE_DELAY}, ${SCHEDULE_METHOD}, ${SCHEDULE_PREFERRED_HOURS}, ${DEADLINE_MINUTES_TO_SCHEDULE}, ${PUPPETEER_HEADLESS})`,
                        (err) => {
                            if (err) {
                                console.log(err);
                                return res
                                    .status(500)
                                    .json({ message: "Internal server error" });
                            }
                            res.status(200).json({
                                message: "Preference created"
                            });
                            setSchedule();
                        }
                    );
                });
            } else {
                db.run(
                    `UPDATE Preference SET HourToSchedule = ${HOUR_TO_SCHEDULE}, DayToSchedule = ${DAY_TO_SCHEDULE}, ScheduleAnticipation = ${SCHEDULE_ANTICIPATION}, ScheduleDelay = ${SCHEDULE_DELAY}, ScheduleMethod = ${SCHEDULE_METHOD}, SchedulePreferredHours = ${SCHEDULE_PREFERRED_HOURS}, DeadlineMinutesToSchedule = ${DEADLINE_MINUTES_TO_SCHEDULE}, PuppeteerHeadless = ${PUPPETEER_HEADLESS}`,
                    (err) => {
                        if (err) {
                            console.log(err);
                            return res
                                .status(500)
                                .json({ message: "Internal server error" });
                        }
                        res.status(200).json({ message: "Preference updated" });
                        setSchedule();
                    }
                );
            }
        });
    });
}

const db = new (sqlite3.verbose().Database)(DB_PATH);
