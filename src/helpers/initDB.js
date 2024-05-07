import sqlite3 from "sqlite3";
import { DB_PATH } from "../constants.js";

export default function initDB(callback) {
    db.serialize(() => {
        db.run(
            `
            CREATE TABLE IF NOT EXISTS "User" (
                "UserID"	INTEGER NOT NULL UNIQUE,
                "Username"	TEXT NOT NULL UNIQUE,
                "Password"	TEXT NOT NULL,
                "Cookies"	TEXT,
                PRIMARY KEY("UserID" AUTOINCREMENT),
                UNIQUE("Username")
            );
        `,
            (err) => {
                if (err) {
                    if (callback) return callback(err);
                    return console.error(err);
                }
                return db.run(
                    `
                CREATE TABLE IF NOT EXISTS "Hour" (
                    "HourID"	INTEGER NOT NULL UNIQUE,
                    "Year"	INTEGER NOT NULL,
                    "Month"	INTEGER NOT NULL,
                    "Day"	INTEGER NOT NULL,
                    "Hour"	INTEGER NOT NULL,
                    PRIMARY KEY("HourID" AUTOINCREMENT)
                );
            `,
                    (err) => {
                        if (err) {
                            if (callback) return callback(err);
                            return console.error(err);
                        }
                        return db.run(
                            `
                    CREATE TABLE IF NOT EXISTS "Preference" (
                        "PreferenceID"	INTEGER NOT NULL UNIQUE,
                        "HourToSchedule"	INTEGER NOT NULL DEFAULT 12,
                        "DayToSchedule"	INTEGER NOT NULL DEFAULT 6,
                        "ScheduleAnticipation"	INTEGER NOT NULL DEFAULT 60000,
                        "ScheduleDelay"	INTEGER NOT NULL DEFAULT 1000,
                        "ScheduleMethod"	INTEGER NOT NULL DEFAULT 0,
                        "SchedulePreferredHours"	INTEGER NOT NULL DEFAULT 0,
                        "DeadlineMinutesToSchedule"	INTEGER NOT NULL DEFAULT 60,
                        "PuppeteerHeadless"	INTEGER NOT NULL DEFAULT 0,
                        PRIMARY KEY("PreferenceID" AUTOINCREMENT)
                    );
                `,
                            (err) => {
                                if (err) {
                                    if (callback) return callback(err);
                                    return console.error(err);
                                }
                                return db.run(
                                    `
                        CREATE TABLE IF NOT EXISTS "PreferredHour" (
                            "PreferredHourID"	INTEGER NOT NULL UNIQUE,
                            "Day"	INTEGER NOT NULL,
                            "Hour"	INTEGER NOT NULL,
                            PRIMARY KEY("PreferredHourID" AUTOINCREMENT)
                        );
                    `,
                                    (err) => {
                                        if (err) {
                                            if (callback) return callback(err);
                                            return console.error(err);
                                        }
                                        if (callback) callback();
                                    }
                                );
                            }
                        );
                    }
                );
            }
        );
    });
}

const db = new (sqlite3.verbose().Database)(DB_PATH);
