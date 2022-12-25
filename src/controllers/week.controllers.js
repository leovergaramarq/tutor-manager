import sqlite3 from 'sqlite3';
import { DB_PATH } from '../constants.js';
import { getEasternTime, getWeekBounds, weekMatrix } from '../helpers/week.js';
import { schedule as sch } from '../helpers/schedule.js';

export function get(req, res) {
	const { week } = req.params;
	
	if(new Date(week) == 'Invalid Date') {
		return res.status(400).json({ message: 'Invalid date' });
	}
	const [sunday, saturday] = getWeekBounds(getEasternTime(new Date(week.replace(/-/g, '/'))));
	
	db.serialize(() => {
		db.all(`SELECT * FROM Hour WHERE
			(Year = ${sunday.getFullYear()} OR Year = ${saturday.getFullYear()})
			AND (Month = ${sunday.getMonth() + 1} OR Month = ${saturday.getMonth() + 1})
			AND Day >= ${sunday.getDate()} AND Day <= ${saturday.getDate()}`, (err, rows) => {
			// 
			if (err) {
				console.log(err);
				return res.status(500).json({ message: err.message });
			}
			
			const week = weekMatrix();
			rows.forEach(row => week[row['Day'] - sunday.getDate()][row.hour] = 1);
			
			res.status(200).json(week);
		});
	});

	// close the database connection
	// db.close();
}

export function schedule(req, res) {
	const { week } = req.body; // if week=0 is provided, schedule the current week; otherwise, schedule the next week
	sch(week === 0 ? week : 1, (status, message) => res.status(status).json({ message }));
}

const db = new (sqlite3.verbose().Database)(DB_PATH);
