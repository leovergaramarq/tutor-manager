import sqlite3 from 'sqlite3';
import { DB_PATH } from '../../constants.js';
import { getWeekBounds, getWeekMatrix } from '../../helpers/week.js';
import { schedule as sch } from '../../helpers/schedule.js';

export function get(req, res) {
	const { week } = req.params;
	// console.log('week', week);

	let date;

	if (week === undefined) {
		date = new Date();
	} else if (!isNaN(week)) {
		// console.log('a');
		if(week < 0) {
			return res.status(400).json({ message: 'Invalid week' });
		}
		date = new Date();
		date.setDate(date.getDate() + week * 7);
		// console.log('date', date);
	} else {
		console.log('b');
		date = new Date(date.replace(/-/g, '/'));
		if (date == 'Invalid Date') {
			return res.status(400).json({ message: 'Invalid date' });
		} else {
			date = new Date(date);
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
			const week = getWeekMatrix();
			hours.forEach(({ Day, Hour }) => week[Day - sunday.getDate()][Hour] = 1);

			res.status(200).json(week);
		});
	});
}

export function clearWeek(req, res) {
	let { date } = req.params;

	if (!date) {
		date = new Date();
	} else {
		date = new Date(date.replace(/-/g, '/'));
		if (date == 'Invalid Date') {
			return res.status(400).json({ message: 'Invalid date' });
		} else {
			date = new Date(date);
		}
	}

	const [sunday, saturday] = getWeekBounds(date);
	console.log(sunday, saturday);

	db.serialize(() => {
		db.run(`
			DELETE FROM Hour
			WHERE (Year = ${sunday.getFullYear()} OR Year = ${saturday.getFullYear()})
			AND (Month = ${sunday.getMonth() + 1} OR Month = ${saturday.getMonth() + 1})
			AND Day >= ${sunday.getDate()} AND Day <= ${saturday.getDate()}
		`, err => {
			if (err) {
				console.log(err);
				return res.status(500).json({ message: err.message });
			}
			res.status(200).json({ message: 'Week cleared' });
		});
	});
}

export function schedule(req, res) {
	const { week } = req.body; // if week=0 is provided, schedule the current week; otherwise, schedule the next week
	
	db.serialize(() => {
		db.all('SELECT * FROM Preference', (err, rows) => {
			if (err) {
				console.log(err);
				return res.status(500).json({ message: err.message });
			}

			if (!rows.length) {
				return res.status(400).json({ message: 'No preferences found' });
			}

			const {
				ScheduleMethod: scheduleMethod,
				SchedulePreferredHours: schedulePreferredHours,
				PuppeteerHeadless: puppeteerHeadless,
			} = rows[0];

			sch(
				week === 0 ? week : 1,
				null,
				{ scheduleMethod, schedulePreferredHours, puppeteerHeadless },
				(status, message) => res.status(status).json({ message })
			);
		});
	});
}

const db = new (sqlite3.verbose().Database)(DB_PATH);
