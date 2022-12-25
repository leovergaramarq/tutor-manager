import sqlite3 from 'sqlite3';
import { DB_PATH } from './constants.js';

export default function initDB(callback) {
    db.serialize(() => {
        db.run(`
            CREATE TABLE IF NOT EXISTS "User" (
                "UserID"	INTEGER NOT NULL UNIQUE,
                "Username"	TEXT NOT NULL UNIQUE,
                "Password"	TEXT NOT NULL,
                PRIMARY KEY("UserID" AUTOINCREMENT),
                UNIQUE("Username")
            );
        `, err => {
            if (err) console.log(err);
            db.run(`
                CREATE TABLE IF NOT EXISTS "Hour" (
                    "HourID"	INTEGER NOT NULL UNIQUE,
                    "Year"	INTEGER NOT NULL,
                    "Month"	INTEGER NOT NULL,
                    "Day"	INTEGER NOT NULL,
                    "Hour"	INTEGER NOT NULL,
                    PRIMARY KEY("HourID" AUTOINCREMENT)
                );
            `, err => {
                if (err) console.log(err);
                db.run(`
                    CREATE TABLE IF NOT EXISTS "Preference"(
                        "HourToSchedule"	INTEGER NOT NULL DEFAULT 12,
                        "DayToSchedule"	INTEGER DEFAULT 6,
                        "KeepLogin"	INTEGER DEFAULT 0
                    );
                `, err => {
                    if(err) return console.log(err);
                    if(callback) callback();
                });
            });
        });
    });
}

const db = new (sqlite3.verbose().Database)(DB_PATH);
