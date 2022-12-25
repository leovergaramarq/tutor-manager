import sqlite3 from 'sqlite3';
import { DAY_TO_SCHEDULE, DB_PATH, HOUR_TO_SCHEDULE, KEEP_LOGIN } from '../constants.js';

const db = new (sqlite3.verbose().Database)(DB_PATH);

export function loadPreferences(app, callback) {
    db.serialize(() => {
        db.all('SELECT * FROM Preference', (err, rows) => {
            if (err) {
                console.log('Could not load preferences from database. Using default values.');
                console.log(err);
                app.set(HOUR_TO_SCHEDULE, 12);
                app.set(DAY_TO_SCHEDULE, 6);
                app.set(KEEP_LOGIN, false);
                return;
            }

            if (!rows.length) {
                console.log('No preferences found in database. Using default values.');

                const hoursDef = 12;
                const daysDef = 6;
                const keepLoginDef = false;
                
                app.set(HOUR_TO_SCHEDULE, hoursDef);
                app.set(DAY_TO_SCHEDULE, daysDef);
                app.set(KEEP_LOGIN, keepLoginDef);

                db.run('INSERT INTO Preference (HourToSchedule, DayToSchedule, KeepLogin) VALUES (?, ?, ?)',
                    [hoursDef, daysDef, keepLoginDef], err => {
                    // 
                    if (err) {
                        console.log('Could not insert preferences into database. Using default values.');
                        console.log(err);
                    }
                });
            } else if (rows.length > 1) {
                console.log('More than one preference found in database. Using default values.');
                app.set(HOUR_TO_SCHEDULE, rows[0].HourToSchedule);
                app.set(DAY_TO_SCHEDULE, rows[0].DayToSchedule);
                app.set(KEEP_LOGIN, rows[0].KeepLogin);

                db.run('DELETE FROM Preference', err => {
                    if (err) {
                        console.log('Could not delete preferences from database. Using default values.');
                        console.log(err);
                        return;
                    }
                    console.log('Deleted all preferences from database.');

                    db.run('INSERT INTO Preference (HourToSchedule, DayToSchedule, KeepLogin) VALUES (?, ?, ?)',
                        [rows[0].HourToSchedule, rows[0].DayToSchedule, rows[0].KeepLogin], err => {
                        // 
                        if (err) {
                            console.log('Could not insert preferences into database. Using default values.');
                            console.log(err);
                        }
                    });
                });
            } else {
                app.set(HOUR_TO_SCHEDULE, rows[0].HourToSchedule);
                app.set(DAY_TO_SCHEDULE, rows[0].DayToSchedule);
                app.set(KEEP_LOGIN, rows[0].KeepLogin);
            }
            
            if (callback) callback();
        });
    });
}
