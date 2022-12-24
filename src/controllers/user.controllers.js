import sqlite3 from 'sqlite3';
import { DB_PATH } from '../constants.js';

const db = new (sqlite3.verbose().Database)(DB_PATH);

export function get(req, res) {
	db.serialize(() => {
		db.all(`SELECT * FROM User`, (err, rows) => {
			if (err) {
				console.log(err);
				return res.status(500).json({ message: err.message });
			}
			res.status(200).json({ user: rows.length ? rows[0] : null });
		});
	});

	// close the database connection
	// db.close();
}
