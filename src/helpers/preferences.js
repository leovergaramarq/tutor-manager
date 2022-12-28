import sqlite3 from 'sqlite3';
import { DB_PATH } from '../constants.js';
import { DAY_TO_SCHEDULE, HOUR_TO_SCHEDULE, KEEP_LOGIN } from '../config.js';

export default function (callback) {
	db.serialize(() => {
		db.all('SELECT * FROM Preference', (err, rows) => {
			if (err) {
				if(callback) return callback(err);
				return console.log(err);
			}

			if (!rows.length) {
				console.log('No preferences found in database. Using default values.');

				db.run('INSERT INTO Preference (HourToSchedule, DayToSchedule, KeepLogin) VALUES (?, ?, ?)', [HOUR_TO_SCHEDULE, DAY_TO_SCHEDULE, KEEP_LOGIN], err => {
					if (err) {
						if(callback) return callback(err);
						console.log(err);
					}
					if(callback) callback();
				});
			} else if (rows.length > 1) {
				console.log('More than one preference found in database. Using default values.');

				db.run('DELETE FROM Preference', err => {
					if (err) {
						if(callback) return callback(err);
						return console.log(err);
					}
					db.run('INSERT INTO Preference (HourToSchedule, DayToSchedule, KeepLogin) VALUES (?, ?, ?)', [rows[0].HourToSchedule, rows[0].DayToSchedule, rows[0].KeepLogin], err => {
						if (err) {
							if(callback) return callback(err);
							return console.log(err);
						}
						if(callback) callback();
					});
				});
			} else {
				if(callback) callback();
			}
		});
	});
}

export function defPreferences() {
	return { HourToSchedule: HOUR_TO_SCHEDULE, DayToSchedule: DAY_TO_SCHEDULE, KeepLogin: KEEP_LOGIN }
}

const db = new (sqlite3.verbose().Database)(DB_PATH);
