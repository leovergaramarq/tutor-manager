import { db } from "./db.config.js";
import {
    DAY_TO_SCHEDULE,
    HOUR_TO_SCHEDULE,
    SCHEDULE_ANTICIPATION,
    SCHEDULE_DELAY,
    SCHEDULE_METHOD,
    SCHEDULE_PREFERRED_HOURS,
    DEADLINE_MINUTES_TO_SCHEDULE,
    PUPPETEER_HEADLESS,
    LOW_SEASON
} from "./general.config.js";

export function initPreferences() {
    return new Promise((res, rej) => {
        db.serialize(() => {
            db.all("SELECT * FROM Preference", (err, rows) => {
                if (err) {
                    return rej(err);
                }

                if (!rows.length) {
                    console.log(
                        "No preferences found in database. Using default values."
                    );

                    db.run(
                        `INSERT INTO Preference (HourToSchedule, DayToSchedule, SchedulePreferredHours, ScheduleMethod, ScheduleDelay, ScheduleAnticipation, DeadlineMinutesToSchedule, PuppeteerHeadless, LowSeason) VALUES (${HOUR_TO_SCHEDULE}, ${DAY_TO_SCHEDULE}, ${SCHEDULE_PREFERRED_HOURS}, ${SCHEDULE_METHOD}, ${SCHEDULE_DELAY}, ${SCHEDULE_ANTICIPATION}, ${DEADLINE_MINUTES_TO_SCHEDULE}, ${PUPPETEER_HEADLESS}, ${LOW_SEASON})`,
                        (err) => {
                            if (err) {
                                return rej(err);
                            }
                            return res();
                        }
                    );
                } else if (rows.length > 1) {
                    console.log(
                        "More than one preference found in database. Using default values."
                    );

                    db.run("DELETE FROM Preference", (err) => {
                        if (err) {
                            return rej(err);
                        }

                        const {
                            HourToSchedule,
                            DayToSchedule,
                            SchedulePreferredHours,
                            ScheduleMethod,
                            ScheduleDelay,
                            ScheduleAnticipation,
                            DeadlineMinutesToSchedule,
                            PuppeteerHeadless,
                            LowSeason
                        } = rows[0];

                        db.run(
                            `INSERT INTO Preference (HourToSchedule, DayToSchedule, SchedulePreferredHours, ScheduleMethod, ScheduleDelay, ScheduleAnticipation, DeadlineMinutesToSchedule, PuppeteerHeadless, LowSeason) VALUES (${HourToSchedule}, ${DayToSchedule}, ${SchedulePreferredHours}, ${ScheduleMethod}, ${ScheduleDelay}, ${ScheduleAnticipation}, ${DeadlineMinutesToSchedule}, ${PuppeteerHeadless}, ${LowSeason})`,
                            (err) => {
                                if (err) {
                                    return rej(err);
                                }
                                return res();
                            }
                        );
                    });
                } else {
                    return res();
                }
            });
        });
    });
}

export function defPreferences() {
    return {
        HourToSchedule: HOUR_TO_SCHEDULE,
        DayToSchedule: DAY_TO_SCHEDULE,
        SchedulePreferredHours: SCHEDULE_PREFERRED_HOURS,
        ScheduleMethod: SCHEDULE_METHOD,
        ScheduleDelay: SCHEDULE_DELAY,
        ScheduleAnticipation: SCHEDULE_ANTICIPATION,
        DeadlineMinutesToSchedule: DEADLINE_MINUTES_TO_SCHEDULE,
        PuppeteerHeadless: PUPPETEER_HEADLESS,
        LowSeason: LOW_SEASON
    };
}
