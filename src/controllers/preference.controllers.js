import sqlite3 from 'sqlite3';
import setSchedule from '../helpers/schedule.js';
import { DB_PATH } from '../constants.js';
import {
	DAY_TO_SCHEDULE,
	HOUR_TO_SCHEDULE,
	SCHEDULE_ANTICIPATION,
	SCHEDULE_DELAY,
	SCHEDULE_METHOD,
	SCHEDULE_PREFERRED_HOURS,
} from '../config.js';

export function get(req, res) {
	db.serialize(() => {
		db.all('SELECT * FROM Preference', (err, rows) => {
			if (err) {
				console.log(err);
				return res.status(500).json({ message: 'Internal server error' });
			}
			if (!rows.length) {
				return res.status(404).json({ message: 'Not found' });
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
	} = req.body;

	if (hourToSchedule === undefined && !dayToSchedule === undefined && scheduleAnticipation === undefined && scheduleDelay === undefined && scheduleMethod === undefined && schedulePreferredHours === undefined) {
		return res.status(400).json({ message: 'Bad request' });
	}

	if (hourToSchedule !== undefined && (hourToSchedule < 0 || hourToSchedule > 23)) {
		return res.status(400).json({ message: 'Invalid hour' });
	}

	if (dayToSchedule !== undefined && (dayToSchedule < 0 || dayToSchedule > 6)) {
		return res.status(400).json({ message: 'Invalid day' });
	}

	delete req.body['PreferenceID'];

	db.serialize(() => {
		db.all('SELECT * FROM Preference', (err, rows) => {
			if (err) {
				console.log(err);
				return res.status(500).json({ message: 'Internal server error' });
			}
			if (!rows.length) {
				if (hourToSchedule === undefined) hourToSchedule = HOUR_TO_SCHEDULE;
				if (dayToSchedule === undefined) dayToSchedule = DAY_TO_SCHEDULE;
				if (scheduleAnticipation === undefined) scheduleAnticipation = SCHEDULE_ANTICIPATION;
				if (scheduleDelay === undefined) scheduleDelay = SCHEDULE_DELAY;
				if (scheduleMethod === undefined) scheduleMethod = SCHEDULE_METHOD;
				if (schedulePreferredHours === undefined) schedulePreferredHours = SCHEDULE_PREFERRED_HOURS;

				db.run(`INSERT INTO Preference (HourToSchedule, DayToSchedule, ScheduleAnticipation, ScheduleDelay, ScheduleMethod, SchedulePreferredHours) VALUES (${hourToSchedule}, ${dayToSchedule}, ${scheduleAnticipation}, ${scheduleDelay}, ${scheduleMethod}, ${schedulePreferredHours})`, err => {
					if (err) {
						console.log(err);
						return res.status(500).json({ message: 'Internal server error' });
					}
					res.status(200).json({ message: 'Preference created' });
					setSchedule();
				});
			} else if (rows.length > 1) {
				db.run('DELETE FROM Preference', err => {
					if (err) {
						console.log(err);
						return res.status(500).json({ message: 'Internal server error' });
					}
					if (hourToSchedule === undefined) hourToSchedule = HOUR_TO_SCHEDULE;
					if (dayToSchedule === undefined) dayToSchedule = DAY_TO_SCHEDULE;
					if (scheduleAnticipation === undefined) scheduleAnticipation = SCHEDULE_ANTICIPATION;
					if (scheduleDelay === undefined) scheduleDelay = SCHEDULE_DELAY;
					if (scheduleMethod === undefined) scheduleMethod = SCHEDULE_METHOD;
					if (schedulePreferredHours === undefined) schedulePreferredHours = SCHEDULE_PREFERRED_HOURS;

					db.run(`INSERT INTO Preference (HourToSchedule, DayToSchedule, ScheduleAnticipation, ScheduleDelay, ScheduleMethod, SchedulePreferredHours) VALUES (${hourToSchedule}, ${dayToSchedule}, ${scheduleAnticipation}, ${scheduleDelay}, ${scheduleMethod}, ${schedulePreferredHours})`, err => {
						if (err) {
							console.log(err);
							return res.status(500).json({ message: 'Internal server error' });
						}
						res.status(200).json({ message: 'Preference created' });
						setSchedule();
					});
				});
			} else {
				if (hourToSchedule === undefined) hourToSchedule = rows[0].HourToSchedule;
				if (dayToSchedule === undefined) dayToSchedule = rows[0].DayToSchedule;
				if (scheduleAnticipation === undefined) scheduleAnticipation = rows[0].ScheduleAnticipation;
				if (scheduleDelay === undefined) scheduleDelay = rows[0].ScheduleDelay;
				if (scheduleMethod === undefined) scheduleMethod = rows[0].ScheduleMethod;
				if (schedulePreferredHours === undefined) schedulePreferredHours = rows[0].SchedulePreferredHours;

				db.run(`UPDATE Preference SET HourToSchedule = ${hourToSchedule}, DayToSchedule = ${dayToSchedule}, ScheduleAnticipation = ${scheduleAnticipation}, ScheduleDelay = ${scheduleDelay}, ScheduleMethod = ${scheduleMethod}, SchedulePreferredHours = ${schedulePreferredHours}`, err => {
					if (err) {
						console.log(err);
						return res.status(500).json({ message: 'Internal server error' });
					}
					res.status(200).json({ message: 'Preference updated' });
					setSchedule();
				});
			}
		});
	});
}

export function reset(req, res) {
	db.serialize(() => {
		db.all('SELECT * FROM Preference', (err, rows) => {
			if (err) {
				console.log(err);
				return res.status(500).json({ message: 'Internal server error' });
			}
			if (!rows.length) {
				db.run(`INSERT INTO Preference (HourToSchedule, DayToSchedule, ScheduleAnticipation, ScheduleDelay, ScheduleMethod, SchedulePreferredHours) VALUES (${HOUR_TO_SCHEDULE}, ${DAY_TO_SCHEDULE}, ${SCHEDULE_ANTICIPATION}, ${SCHEDULE_DELAY}, ${SCHEDULE_METHOD}, ${SCHEDULE_PREFERRED_HOURS})`, err => {
					if (err) {
						console.log(err);
						return res.status(500).json({ message: 'Internal server error' });
					}
					res.status(200).json({ message: 'Preference created' });
					setSchedule();
				});
			} else if (rows.length > 1) {
				db.run('DELETE FROM Preference', err => {
					if (err) {
						console.log(err);
						return res.status(500).json({ message: 'Internal server error' });
					}
					db.run(`INSERT INTO Preference (HourToSchedule, DayToSchedule, ScheduleAnticipation, ScheduleDelay, ScheduleMethod, SchedulePreferredHours) VALUES (${HOUR_TO_SCHEDULE}, ${DAY_TO_SCHEDULE}, ${SCHEDULE_ANTICIPATION}, ${SCHEDULE_DELAY}, ${SCHEDULE_METHOD}, ${SCHEDULE_PREFERRED_HOURS})`, err => {
						if (err) {
							console.log(err);
							return res.status(500).json({ message: 'Internal server error' });
						}
						res.status(200).json({ message: 'Preference created' });
						setSchedule();
					});
				});
			} else {
				db.run(`UPDATE Preference SET HourToSchedule = ${HOUR_TO_SCHEDULE}, DayToSchedule = ${DAY_TO_SCHEDULE}, ScheduleAnticipation = ${SCHEDULE_ANTICIPATION}, ScheduleDelay = ${SCHEDULE_DELAY}, ScheduleMethod = ${SCHEDULE_METHOD}, SchedulePreferredHours = ${SCHEDULE_PREFERRED_HOURS}`, err => {
					if (err) {
						console.log(err);
						return res.status(500).json({ message: 'Internal server error' });
					}
					res.status(200).json({ message: 'Preference updated' });
					setSchedule();
				});
			}
		});
	});
}

const db = new (sqlite3.verbose().Database)(DB_PATH);
