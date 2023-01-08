import sqlite3 from 'sqlite3';
import { DB_PATH } from '../constants.js';

export function add(req, res) {
	const { year, month, day, hour } = req.body;
	if (year === undefined || month === undefined || day === undefined || hour === undefined) {
		return res.status(400).json({ message: 'Missing parameters' });
	}

	if (hour > 23) return res.status(400).json({ message: 'Invalid hour' });

	if (new Date(`${year}-${month}-${day} ${hour}:`) == 'Invalid Date') {
		return res.status(400).json({ message: 'Invalid date' });
	}

	db.serialize(() => {
		db.all('SELECT * FROM Hour WHERE Year = ? AND Month = ? AND Day = ? AND Hour = ?', [year, month, day, hour], (err, rows) => {
			if (err) {
				console.log(err);
				return res.status(500).json({ message: err.message });
			}
			if (rows.length) {
				return res.status(400).json({ message: 'Hour already exists' });
			}

			db.run(`INSERT INTO Hour (Year, Month, Day, Hour) VALUES (${year}, ${month}, ${day}, ${hour})`, err => {
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
			db.run(`DELETE FROM Hour WHERE HourID = ${id}`, err => {
				if (err) {
					console.log(err);
					return res.status(500).json({ message: err.message });
				}
				res.status(200).json({ message: 'OK' })
			});
		});
	} else { // if id is a date (YYYY-MM-DD-HH)
		const [year, month, day, hour] = id.split('-');

		if (!year || !month || !day || !hour || new Date(`${year}-${month}-${day} ${hour}:`) == 'Invalid Date') {
			return res.status(400).json({ message: 'Invalid date' });
		}

		db.serialize(() => {
			db.run(`DELETE FROM Hour WHERE Year = ${year} AND Month = ${month} AND Day = ${day} AND Hour = ${hour}`, err => {
				if (err) {
					console.log(err);
					return res.status(500).json({ message: err.message });
				}
				res.status(200).json({ message: 'OK' })
			});
		});
	}
}

const db = new (sqlite3.verbose().Database)(DB_PATH);
