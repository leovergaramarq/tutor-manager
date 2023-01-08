import sqlite3 from 'sqlite3';
import { DB_PATH } from '../constants.js';
import { weekMatrix } from '../helpers/week.js';

export function get(req, res) {
	db.serialize(() => {
		db.all('SELECT * FROM PreferredHour', (err, hours) => {
			if (err) {
				console.log(err);
				return res.status(500).json({ message: err.message });
			}
			console.log(hours);
			const week = weekMatrix();
			hours.forEach(({ Day, Hour }) => week[Day][Hour] = 1);

			res.status(200).json(week);
		});
	});
}

export function add(req, res) {
	const { day, hour } = req.body;
	
	if (isNaN(day) || isNaN(hour)) {
		return res.status(400).json({ message: 'Invalid day or hour' });
	}

	if (hour < 0 || hour > 23) {
		return res.status(400).json({ message: 'Invalid hour' });
	}

	if (day < 0 || day > 6) {
		return res.status(400).json({ message: 'Invalid day' });
	}

	db.serialize(() => {
		db.all(`SELECT * FROM PreferredHour WHERE Day = ${day} AND Hour = ${hour}`, (err, rows) => {
			if (err) {
				console.log(err);
				return res.status(500).json({ message: err.message });
			}
			if (rows.length) {
				return res.status(400).json({ message: 'Hour already exists' });
			}

			db.run(`INSERT INTO Hour (Day, Hour) VALUES (${day}, ${hour})`, err => {
				if (err) {
					console.log(err);
					return res.status(500).json({ message: err.message });
				}
				res.status(201).json({ message: 'OK' })
			});
		});
	});
}

export function remove(req, res) {
	const { id } = req.params;

	if (!isNaN(id)) { // if id is a number
		db.serialize(() => {
			db.run(`DELETE FROM PreferredHour WHERE PreferredHourID = ${id}`, err => {
				if (err) {
					console.log(err);
					return res.status(500).json({ message: err.message });
				}
				res.status(200).json({ message: 'OK' })
			});
		});
	} else { // if id is a day-hour (DD-HH)
		const [day, hour] = id.split('-');

		if (!day || !hour || isNaN(day) || isNaN(hour)) {
			return res.status(400).json({ message: 'Invalid date' });
		}

		db.serialize(() => {
			db.run(`DELETE FROM PreferredHour WHERE Day = ${day} AND Hour = ${hour}`, err => {
				if (err) {
					console.log(err);
					return res.status(500).json({ message: err.message });
				}
				res.status(200).json({ message: 'OK' })
			});
		});
	}
}

export function clearAll(req, res) {
	db.serialize(() => {
		db.run('DELETE FROM PreferredHour', err => {
			if (err) {
				console.log(err);
				return res.status(500).json({ message: err.message });
			}
			res.status(200).json({ message: 'OK' })
		});
	});
}

const db = new (sqlite3.verbose().Database)(DB_PATH);
