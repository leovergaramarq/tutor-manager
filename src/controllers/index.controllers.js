import jwt from 'jsonwebtoken';
import sqlite3 from 'sqlite3';

import { JWT_SECRET } from '../config.js'
import { DB_PATH, JWT_EXPIRY_TIME } from '../constants.js';

export function hello(req, res, next) {
	db.serialize(() => {
		db.all('SELECT "Database running!" AS Result', (err, rows) => {
			if (err) {
				console.log(err);
				return res.status(500).json({ message: err.message });
			}
			res.status(200).json({ message: rows[0]?.Result });
		});
	});

	// db.close();
}

export function login(req, res, next) {
	const { username, password } = req.body;

	db.serialize(() => {
		db.all('SELECT * FROM User', (err, rows) => {
			console.log(rows);
			// return res.status(200).json({ message: 'sdasd' });
			if (err) {
				console.log(err);
				return res.status(500).json({ message: err.message });
			}

			const tokenRes = () => ({
				token: jwt.sign({ username }, JWT_SECRET, { expiresIn: JWT_EXPIRY_TIME })
			});

			if (!rows.length) {
				console.log('no rows');
				db.run(`INSERT INTO User (Username, Password) VALUES (?, ?)`, [username, password], err => {
					if (err) {
						console.log(err);
						return res.status(500).json({ message: err.message });
					}
					return res.status(201).json(tokenRes());
				});
			} else if (rows.length > 1) {
				console.log('more than one row');
				db.run('DELETE FROM User', err => {
					if (err) {
						console.log(err);
						return res.status(500).json({ message: err.message });
					}
					db.run(`INSERT INTO User (Username, Password) VALUES (?, ?)`, [username, password], err => {
						if (err) {
							console.log(err);
							return res.status(500).json({ message: err.message });
						}
						return res.status(201).json(tokenRes());
					});
				});
			} else {
				console.log('one row');
				const user = rows[0];
				if (user['Username'] !== username || user['Password'] !== password) {
					console.log('username or password not match');
					const asd = db.run(`UPDATE User SET Username=${username}, Password=${password}`, err => {
						if (err) {
							console.log(err);
							return res.status(500).json({ message: err.message });
						}
						return res.status(201).json(tokenRes());
					});
					console.log(asd);
				} else {
					console.log('username and password match');
					return res.status(201).json(tokenRes());
				}
			}
		});
	});

	// db.close();
}

const db = new (sqlite3.verbose().Database)(DB_PATH);