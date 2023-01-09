import sqlite3 from 'sqlite3';

import { DB_PATH } from '../../constants.js';

export function hello(_, res) {
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

export function login(req, res) {
	const { username, password } = req.body;

	db.serialize(() => {
		db.all('SELECT * FROM User', (err, users) => {
			console.log(users);
			// return res.status(200).json({ message: 'sdasd' });
			if (err) {
				console.log(err);
				return res.status(500).json({ message: err.message });
			}

			if (!users.length) {
				console.log('no rows');
				db.run(`INSERT INTO User (Username, Password) VALUES (?, ?)`, [username, password], err => {
					if (err) {
						console.log(err);
						return res.status(500).json({ message: err.message });
					}
					res.status(201).json({ message: 'Logged in successfully'});
				});
			} else if (users.length > 1) {
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
						res.status(201).json({ message: 'Logged in successfully'});
					});
				});
			} else {
				console.log('one row');
				if (users[0]['Username'] !== username || users[0]['Password'] !== password) {
					console.log('username or password not match');
					const asd = db.run(`UPDATE User SET Username=${username}, Password=${password}`, err => {
						if (err) {
							console.log(err);
							return res.status(500).json({ message: err.message });
						}
						res.status(201).json({ message: 'Logged in successfully'});
					});
					console.log(asd);
				} else {
					console.log('username and password match');
					return res.status(201).json({ message: 'Logged in successfully'});
				}
			}
		});
	});

	// db.close();
}

export function logout(req, res) {
	db.serialize(() => {
		db.run('DELETE FROM User', err => {
			if (err) {
				console.log(err);
				return res.status(500).json({ message: err.message });
			}
			res.status(200).json({ message: 'Logged out successfully' });
		});
	});

	// db.close();
}

const db = new (sqlite3.verbose().Database)(DB_PATH);
