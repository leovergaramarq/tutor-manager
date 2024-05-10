import sqlite3 from "sqlite3";
import { DB_PATH } from "../../constants.js";
import { getWeekMatrix } from "../../helpers/week.js";

export function get(req, res) {
    db.serialize(() => {
        db.all("SELECT * FROM PreferredHour", (err, hours) => {
            if (err) {
                console.error(err);
                return res
                    .status(500)
                    .json({ message: "Internal server error" });
            }
            console.log(hours);
            const week = getWeekMatrix();
            hours.forEach(({ Day, Hour }) => (week[Day][Hour] = 1));

            res.status(200).json(week);
        });
    });
}

export function add(req, res) {
    const { hours } = req.body;

    if (hours === undefined) {
        const { day, hour } = req.body;

        if (isNaN(day) || isNaN(hour)) {
            return res.status(400).json({ message: "Invalid day or hour" });
        }

        if (hour < 0 || hour > 23) {
            return res.status(400).json({ message: "Invalid hour" });
        }

        if (day < 0 || day > 6) {
            return res.status(400).json({ message: "Invalid day" });
        }

        db.serialize(() => {
            db.all(
                `SELECT * FROM PreferredHour WHERE Day = ${day} AND Hour = ${hour}`,
                (err, rows) => {
                    if (err) {
                        console.error(err);
                        return res
                            .status(500)
                            .json({ message: "Internal server error" });
                    }
                    if (rows.length) {
                        return res
                            .status(400)
                            .json({ message: "Hour already exists" });
                    }

                    db.run(
                        `INSERT INTO Hour (Day, Hour) VALUES (${day}, ${hour})`,
                        (err) => {
                            if (err) {
                                console.error(err);
                                return res
                                    .status(500)
                                    .json({ message: err.message });
                            }
                            res.status(201).json({ message: "OK" });
                        }
                    );
                }
            );
        });
    } else {
        if (
            !Array.isArray(hours) ||
            hours.length !== 7 ||
            hours[0].length !== 24
        ) {
            return res.status(400).json({ message: "Invalid hours" });
        }

        db.serialize(() => {
            let count = 0;

            hours.forEach((day, i) => {
                day.forEach((hour, j) => {
                    if (hour === 1) {
                        db.all(
                            `SELECT * FROM PreferredHour WHERE Day = ${i} AND Hour = ${j}`,
                            (err, rows) => {
                                if (err) {
                                    console.error(err);
                                }
                                if (rows?.length) {
                                    count++;
                                    if (count === 168)
                                        res.status(201).json({ message: "OK" });
                                } else {
                                    db.run(
                                        `INSERT INTO PreferredHour (Day, Hour) VALUES (${i}, ${j})`,
                                        (err) => {
                                            if (err) {
                                                console.error(err);
                                            }
                                            count++;
                                            if (count === 168)
                                                res.status(201).json({
                                                    message: "OK"
                                                });
                                        }
                                    );
                                }
                            }
                        );
                    } else if (hour === 0) {
                        db.run(
                            `DELETE FROM PreferredHour WHERE Day = ${i} AND Hour = ${j}`,
                            (err) => {
                                if (err) {
                                    console.error(err);
                                }
                                count++;
                                if (count === 168)
                                    res.status(201).json({ message: "OK" });
                            }
                        );
                    }
                });
            });
        });
    }
}

export function remove(req, res) {
    const { id } = req.params;

    if (!isNaN(id)) {
        // if id is a number
        db.serialize(() => {
            db.run(
                `DELETE FROM PreferredHour WHERE PreferredHourID = ${id}`,
                (err) => {
                    if (err) {
                        console.error(err);
                        return res
                            .status(500)
                            .json({ message: "Internal server error" });
                    }
                    res.status(200).json({ message: "OK" });
                }
            );
        });
    } else {
        // if id is a day-hour (DD-HH)
        const [day, hour] = id.split("-");

        if (!day || !hour || isNaN(day) || isNaN(hour)) {
            return res.status(400).json({ message: "Invalid date" });
        }

        db.serialize(() => {
            db.run(
                `DELETE FROM PreferredHour WHERE Day = ${day} AND Hour = ${hour}`,
                (err) => {
                    if (err) {
                        console.error(err);
                        return res
                            .status(500)
                            .json({ message: "Internal server error" });
                    }
                    res.status(200).json({ message: "OK" });
                }
            );
        });
    }
}

export function clearAll(req, res) {
    db.serialize(() => {
        db.run("DELETE FROM PreferredHour", (err) => {
            if (err) {
                console.error(err);
                return res
                    .status(500)
                    .json({ message: "Internal server error" });
            }
            res.status(200).json({ message: "OK" });
        });
    });
}

const db = new (sqlite3.verbose().Database)(DB_PATH);
