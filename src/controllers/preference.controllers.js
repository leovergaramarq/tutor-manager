import sqlite3 from 'sqlite3';
import { DAY_TO_SCHEDULE, HOUR_TO_SCHEDULE, KEEP_LOGIN } from '../config.js';
import { DB_PATH } from '../constants.js';
import setSchedule from '../helpers/schedule.js';

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
	let { hourToSchedule, dayToSchedule, keepLogin } = req.body;
	if (hourToSchedule === undefined && !dayToSchedule === undefined && keepLogin === undefined) {
		return res.status(400).json({ message: 'Bad request' });
	}
	if(hourToSchedule !== undefined && (hourToSchedule < 0 || hourToSchedule > 23)) {
		return res.status(400).json({ message: 'Invalid hour' });
	}
	if(dayToSchedule !== undefined && (dayToSchedule < 0 || dayToSchedule > 6)) {
		return res.status(400).json({ message: 'Invalid day' });
	}
	if(keepLogin !== undefined && (keepLogin !== 0 && keepLogin !== 1)) {
		return res.status(400).json({ message: 'Invalid keepLogin' });
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
				if (keepLogin === undefined) keepLogin = KEEP_LOGIN;
				db.run('INSERT INTO Preference (HourToSchedule, DayToSchedule, KeepLogin) VALUES (?, ?, ?)', [hourToSchedule, dayToSchedule, keepLogin], err => {
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
					if (keepLogin === undefined) keepLogin = KEEP_LOGIN;
					db.run('INSERT INTO Preference (HourToSchedule, DayToSchedule, KeepLogin) VALUES (?, ?, ?)', [hourToSchedule, dayToSchedule, keepLogin], err => {
						if (err) {
							console.log(err);
							return res.status(500).json({ message: 'Internal server error' });
						}
						res.status(200).json({ message: 'Preference created' });
						setSchedule();
					});
				});
			} else {
				if(hourToSchedule === undefined) hourToSchedule = rows[0].HourToSchedule;
				if(dayToSchedule === undefined) dayToSchedule = rows[0].DayToSchedule;
				if(keepLogin === undefined) keepLogin = rows[0].KeepLogin;
				db.run('UPDATE Preference SET HourToSchedule = ?, DayToSchedule = ?, KeepLogin = ?', [hourToSchedule, dayToSchedule, keepLogin], err => {
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

	// close the database connection
	// db.close();
}

export function reset(req, res) {
	db.serialize(() => {
		db.all('SELECT * FROM Preference', (err, rows) => {
			if (err) {
				console.log(err);
				return res.status(500).json({ message: 'Internal server error' });
			}
			if (!rows.length) {
				db.run('INSERT INTO Preference (HourToSchedule, DayToSchedule, KeepLogin) VALUES (?, ?, ?)', [HOUR_TO_SCHEDULE, DAY_TO_SCHEDULE, KEEP_LOGIN], err => {
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
					db.run('INSERT INTO Preference (HourToSchedule, DayToSchedule, KeepLogin) VALUES (?, ?, ?)', [HOUR_TO_SCHEDULE, DAY_TO_SCHEDULE, KEEP_LOGIN], err => {
						if (err) {
							console.log(err);
							return res.status(500).json({ message: 'Internal server error' });
						}
						res.status(200).json({ message: 'Preference created' });
						setSchedule();
					});
				});
			} else {
				db.run('UPDATE Preference SET HourToSchedule = ?, DayToSchedule = ?, KeepLogin = ?', [HOUR_TO_SCHEDULE, DAY_TO_SCHEDULE, KEEP_LOGIN], err => {
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

	// close the database connection
	// db.close();
}

const db = new (sqlite3.verbose().Database)(DB_PATH);
