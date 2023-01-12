import puppeteer from 'puppeteer';
import sqlite3 from 'sqlite3';
import sleep from '../../helpers/sleep.js';
import { DB_PATH, URL_BILLING, URL_RATING, URL_USD } from '../../constants.js';

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
				db.run(`INSERT INTO User (Username, Password) VALUES ('${username}', '${password}')`, err => {
					if (err) {
						console.log(err);
						return res.status(500).json({ message: err.message });
					}
					res.status(201).json({ message: 'Logged in successfully'});
				});
			} else if (users.length > 1) {
				db.run('DELETE FROM User', err => {
					if (err) {
						console.log(err);
						return res.status(500).json({ message: err.message });
					}
					db.run(`INSERT INTO User (Username, Password) VALUES (${username}, ${password})`, err => {
						if (err) {
							console.log(err);
							return res.status(500).json({ message: err.message });
						}
						res.status(201).json({ message: 'Logged in successfully'});
					});
				});
			} else {
				if (users[0]['Username'] !== username || users[0]['Password'] !== password) {
					db.run(`UPDATE User SET Username=${username}, Password=${password}`, err => {
						if (err) {
							console.log(err);
							return res.status(500).json({ message: err.message });
						}
						res.status(201).json({ message: 'Logged in successfully'});
					});
				} else {
					return res.status(201).json({ message: 'Logged in successfully'});
				}
			}
		});
	});
}

export function logout(req, res) {
	db.serialize(() => {
		db.run('DELETE FROM User', err => {
			if (err) {
				console.log(err);
				return res.status(500).json({ message: err.message });
			}
			res.status(201).json({ message: 'Logged out successfully'});
		});
	});
}

export function billing(req, res) {
	db.serialize(() => {
		db.all('SELECT * FROM User', async (err, users) => {
			if (err) {
				console.log(err);
				return res.status(500).json({ message: err.message });
			}
			if (users.length !== 1) {
				return res.status(500).json({ message: 'No hay usuarios registrados' });
			}

			try {
				// start puppeteer
				// const browser = await puppeteer.launch({ headless: false });
				const browser = await puppeteer.launch();
				const page = await browser.newPage();
				await page.goto(URL_BILLING, { timeout: 0 });
				// await page.waitForNavigation();
				await sleep(500);

				await page.waitForSelector('#butSignIn');
				await page.type('#txtUserName', users[0].Username);
				await page.type('#txtPassword', users[0].Password);
				await sleep(500);
				await page.click('#butSignIn');
				
				await page.waitForSelector('table');

				const data = await page.$eval('tr:nth-child(2)', el => {
					console.log(el);
					return {
						scheduledHours: +el.children[2].innerText,
						onlineHours: +el.children[3].innerText,
						minutesWaiting: +el.children[8].innerText.replace(/,/g, ''),
						minutesInSession: +el.children[9].innerText.replace(/,/g, '')
					}
				});

				res.status(200).json(data);
				await browser.close();

			} catch (err) {
				console.log(err);
				res.status(500).json({ message: err.message });
			}
		});
	});
}

export function rating(req, res) {
	db.serialize(() => {
		db.all('SELECT * FROM User', async (err, users) => {
			if (err) {
				console.log(err);
				return res.status(500).json({ message: err.message });
			}
			if (users.length !== 1) {
				return res.status(500).json({ message: 'No hay usuarios registrados' });
			}

			try {
				// start puppeteer
				// const browser = await puppeteer.launch({ headless: false });
				const browser = await puppeteer.launch();
				const page = await browser.newPage();
				await page.goto(URL_RATING, { timeout: 0 });
				// await page.waitForNavigation();
				await sleep(500);

				await page.waitForSelector('#butSignIn');
				await page.type('#txtUserName', users[0].Username);
				await page.type('#txtPassword', users[0].Password);
				await sleep(500);
				await page.click('#butSignIn');
				
				await page.waitForSelector('table');

				return res.status(200).json({ message: 'ok' });
				
				const data = await page.$eval('tr:nth-child(2)', el => {
					console.log(el);
					return {
						scheduledHours: +el.children[2].innerText,
						onlineHours: +el.children[3].innerText,
						minutesWaiting: +el.children[8].innerText.replace(/,/g, ''),
						minutesInSession: +el.children[9].innerText.replace(/,/g, '')
					}
				});

				res.status(200).json(data);
				await browser.close();

			} catch (err) {
				console.log(err);
				res.status(500).json({ message: err.message });
			}
		});
	});
}

export async function usd(req, res) {
	try {
		// start puppeteer
		// const browser = await puppeteer.launch({ headless: false });
		const browser = await puppeteer.launch();
		const page = await browser.newPage();
		await page.goto(URL_USD, { timeout: 0 });
		// await page.waitForNavigation();
		await sleep(500);

		return res.status(200).json({ message: 'ok' });

	} catch (err) {
		console.log(err);
		res.status(500).json({ message: err.message });
	}
}

const db = new (sqlite3.verbose().Database)(DB_PATH);
