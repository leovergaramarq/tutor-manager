import sqlite3 from 'sqlite3';
import { DB_PATH } from '../../constants.js';
import { getWeekBounds } from '../../helpers/week.js';

export function add(req, res) {
	const { week } = req.body;

	if (week === undefined) { // schedule individual hour
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
	} else { // schedule week
		const { hours } = req.body;
		// console.log(hours);
		if (!hours) return res.status(400).json({ message: 'Missing hours' });
		if (isNaN(week) || week < 0) return res.status(400).json({ message: 'Invalid week' });
		if (!Array.isArray(hours) || hours.length !== 7 || hours[0].length !== 24) {
			return res.status(400).json({ message: 'Invalid hours' });
		}

		db.serialize(() => {
			const [sunday] = getWeekBounds(new Date(new Date().getTime() + week * 604800000));
			let count = 0;
			
			hours.forEach((day, i) => {
				day.forEach((hour, j) => {
					// const date = new Date(sunday.getTime() + i * 86400000 + j * 3600000);
					const date = new Date(sunday);
					date.setDate(date.getDate() + i);
					date.setHours(j);
					if (hour === 1) {
						db.all(`SELECT * FROM Hour WHERE Year = ${date.getFullYear()} AND Month = ${date.getMonth() + 1} AND Day = ${date.getDate()} AND Hour = ${date.getHours()}`, (err, rows) => {
							if (err) {
								console.log(err);
							}
							if (rows.length) { // hour already exists
								count++;
								if (count === 168) res.status(201).json({ message: 'OK' });
							} else {
								db.run(`INSERT INTO Hour (Year, Month, Day, Hour) VALUES (${date.getFullYear()}, ${date.getMonth() + 1}, ${date.getDate()}, ${date.getHours()})`, err => {
									if (err) {
										console.log(err);
									}
									count++;
									if (count === 168) res.status(201).json({ message: 'OK' });
								});
							}
						});
					} else if (hour === 0) {
						db.run(`DELETE FROM Hour WHERE Year = ${date.getFullYear()} AND Month = ${date.getMonth() + 1} AND Day = ${date.getDate()} AND Hour = ${date.getHours()}`, err => {
							if (err) {
								console.log(err);
							}
							count++;
							if (count === 168) res.status(201).json({ message: 'OK' });
						});
					}
				});
			});
		});
	}
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
