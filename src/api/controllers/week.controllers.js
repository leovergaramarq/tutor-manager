import { db } from "../../config/db.config.js";
import {
    getWeekBounds,
    getWeekMatrix,
    newDate
} from "../../helpers/utils.helper.js";
import { schedule as sch } from "../../services/schedule.service.js";

export function get(req, res) {
    const { week } = req.params;

    let date;

    if (week === undefined) {
        date = newDate();
    } else if (!isNaN(week)) {
        if (week < 0) {
            return res.status(400).json({ message: "Invalid week" });
        }
        date = newDate();
        date.setDate(date.getDate() + week * 7);
    } else {
        date = newDate(date.replace(/-/g, "/"));
        if (date === "Invalid Date") {
            return res.status(400).json({ message: "Invalid date" });
        } else {
            date = newDate(date);
        }
    }

    const [sunday, saturday] = getWeekBounds(date);

    db.serialize(() => {
        db.all("SELECT * FROM Preference", (err, rows) => {
            if (err) {
                console.error(err);
                return res
                    .status(500)
                    .json({ message: "Internal server error" });
            }

            if (!rows.length) {
                return res
                    .status(400)
                    .json({ message: "No preferences found" });
            }

            const { SchedulePreferredHours: schedulePreferredHours } = rows[0];

            const queryHours =
                schedulePreferredHours === 0
                    ? `SELECT * FROM Hour WHERE
                    (Year = ${sunday.getFullYear()} OR Year = ${saturday.getFullYear()})
                    AND (Month = ${sunday.getMonth() + 1} OR Month = ${
                          saturday.getMonth() + 1
                      })
                    AND Day >= ${sunday.getDate()} AND Day <= ${saturday.getDate()}`
                    : `SELECT * FROM PreferredHour`;

            db.all(queryHours, (err, hours) => {
                if (err) {
                    console.error(err);
                    return res
                        .status(500)
                        .json({ message: "Internal server error" });
                }

                const week = getWeekMatrix();
                hours.forEach(({ Day, Hour }) => {
                    const dayOfWeek =
                        schedulePreferredHours === 0
                            ? Day - sunday.getDate()
                            : Day;
                    return (week[dayOfWeek][Hour] = 1);
                });

                res.status(200).json(week);
            });
        });
    });
}

export function clearWeek(req, res) {
    let { date } = req.params;

    if (!date) {
        date = newDate();
    } else {
        date = newDate(date.replace(/-/g, "/"));
        if (date === "Invalid Date") {
            return res.status(400).json({ message: "Invalid date" });
        } else {
            date = newDate(date);
        }
    }

    const [sunday, saturday] = getWeekBounds(date);
    console.log(sunday, saturday);

    db.serialize(() => {
        db.run(
            `
			DELETE FROM Hour
			WHERE (Year = ${sunday.getFullYear()} OR Year = ${saturday.getFullYear()})
			AND (Month = ${sunday.getMonth() + 1} OR Month = ${saturday.getMonth() + 1})
			AND Day >= ${sunday.getDate()} AND Day <= ${saturday.getDate()}
		`,
            (err) => {
                if (err) {
                    console.error(err);
                    return res
                        .status(500)
                        .json({ message: "Internal server error" });
                }
                res.status(200).json({ message: "Week cleared" });
            }
        );
    });
}

export function schedule(req, res) {
    const { week } = req.body; // if week=0 is provided, schedule the current week; otherwise, schedule the next week

    db.serialize(() => {
        db.all("SELECT * FROM Preference", (err, rows) => {
            if (err) {
                console.error(err);
                return res
                    .status(500)
                    .json({ message: "Internal server error" });
            }

            if (!rows.length) {
                return res
                    .status(400)
                    .json({ message: "No preferences found" });
            }

            const {
                ScheduleMethod: scheduleMethod,
                SchedulePreferredHours: schedulePreferredHours,
                PuppeteerHeadless: puppeteerHeadless
            } = rows[0];

            sch(
                week === 0 ? week : 1,
                null,
                { scheduleMethod, schedulePreferredHours, puppeteerHeadless },
                (status, message) => res.status(status).json({ message })
            );
        });
    });
}
