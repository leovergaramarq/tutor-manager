import sqlite3 from 'sqlite3';
import { DB_PATH } from '../constants.js';
import {
	DAY_TO_SCHEDULE,
	HOUR_TO_SCHEDULE,
	SCHEDULE_ANTICIPATION,
	SCHEDULE_DELAY,
	SCHEDULE_METHOD,
	SCHEDULE_PREFERRED_HOURS, 
} from '../config.js';

export default function (callback) {
	db.serialize(() => {
		db.all('SELECT * FROM Preference', (err, rows) => {
			if (err) {
				if(callback) return callback(err);
				return console.log(err);
			}

			if (!rows.length) {
				console.log('No preferences found in database. Using default values.');

				db.run(`INSERT INTO Preference (HourToSchedule, DayToSchedule, SchedulePreferredHours, ScheduleMethod, ScheduleDelay, ScheduleAnticipation) VALUES (${HOUR_TO_SCHEDULE}, ${DAY_TO_SCHEDULE}, ${SCHEDULE_PREFERRED_HOURS}, ${SCHEDULE_METHOD}, ${SCHEDULE_DELAY}, ${SCHEDULE_ANTICIPATION})`, err => {
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

					const {HourToSchedule, DayToSchedule, SchedulePreferredHours, ScheduleMethod, ScheduleDelay, ScheduleAnticipation} = rows[0];
					db.run(`INSERT INTO Preference (HourToSchedule, DayToSchedule, SchedulePreferredHours, ScheduleMethod, ScheduleDelay, ScheduleAnticipation) VALUES (${HourToSchedule}, ${DayToSchedule}, ${SchedulePreferredHours}, ${ScheduleMethod}, ${ScheduleDelay}, ${ScheduleAnticipation})`, err => {
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
	return {
		HourToSchedule: HOUR_TO_SCHEDULE,
		DayToSchedule: DAY_TO_SCHEDULE,
		SchedulePreferredHours: SCHEDULE_PREFERRED_HOURS,
		ScheduleMethod: SCHEDULE_METHOD,
		ScheduleDelay: SCHEDULE_DELAY,
		ScheduleAnticipation: SCHEDULE_ANTICIPATION,
	}
}

const db = new (sqlite3.verbose().Database)(DB_PATH);
