import sqlite3 from 'sqlite3';
import { DB_PATH } from '../constants.js';
import { getEasternTime, getWeekBounds, weekMatrix } from '../helpers/week.js';
import { schedule as sch } from '../helpers/schedule.js';
import { defPreferences } from '../helpers/preferences.js';

export function get(req, res) {
	let { date } = req.params;
	
	if(!date) {
		date = getEasternTime();
	} else {
		date = new Date(date.replace(/-/g, '/'));
		if(date == 'Invalid Date') {
			return res.status(400).json({ message: 'Invalid date' });
		} else {
			date = getEasternTime(date);
		}
	}
	console.log(date);
	
	const [sunday, saturday] = getWeekBounds(date);
	console.log(sunday, saturday);
	
	db.serialize(() => {
		db.all(`SELECT * FROM Hour WHERE
			(Year = ${sunday.getFullYear()} OR Year = ${saturday.getFullYear()})
			AND (Month = ${sunday.getMonth() + 1} OR Month = ${saturday.getMonth() + 1})
			AND Day >= ${sunday.getDate()} AND Day <= ${saturday.getDate()}`, (err, hours) => {
			// 
			if (err) {
				console.log(err);
				return res.status(500).json({ message: err.message });
			}
			console.log(hours);
			const week = weekMatrix();
			hours.forEach(({Day, Hour}) => week[Day - sunday.getDate()][Hour] = 1);
			
			res.status(200).json(week);
		});
	});

	// close the database connection
	// db.close();
}

export function schedule(req, res) {
	const { week } = req.body; // if week=0 is provided, schedule the current week; otherwise, schedule the next week
	db.serialize(() => {
		db.all('SELECT * FROM Preference', (err, rows) => {
			if (err) {
				return console.log('Could not load preferences from database. Using default values.');
			}
			let preferences;
			if (!rows.length) {
				console.log('No preferences found in database. Using default values.');
				preferences = defPreferences();
			} else {
				preferences = rows[0];
			}
			sch(week === 0 ? week : 1, null, (status, message) => res.status(status).json({ message }));
		});
	});
}

const db = new (sqlite3.verbose().Database)(DB_PATH);
