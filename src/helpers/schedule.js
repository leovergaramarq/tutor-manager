import puppeteer from 'puppeteer';
import sqlite3 from 'sqlite3';
import { PUPPETEER_HEADLESS, SCHEDULE_ANTICIPATION, SHCEDULE_DELAY } from '../config.js';
import {
	DB_PATH,
	SCHEDULE_INTERVAL,
	SCHEDULE_TIMEOUT,
	URL_SCHEDULE
} from '../constants.js';
import { defPreferences } from './preferences.js';
import { getWeekBounds, getEasternTime } from './week.js';

export default function setSchedule(app) {
	console.log('Setting schedule...');
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

			const { HourToSchedule, DayToSchedule } = preferences;
			const interval = setInterval(async () => {
				const date = new Date(getEasternTime() + SCHEDULE_ANTICIPATION);
				if (date.getHours() === HourToSchedule && date.getDay() === DayToSchedule) {
					clearInterval(interval);

					setTimeout(() => {
						console.log('Resetting interval...');
						setSchedule(app);
					}, 3600000 + SCHEDULE_ANTICIPATION + 1); // why 1? idk

					schedule(1, preferences);
				}
			}, 1000);
		});
	});
}

// week = 0 for this week, 1 for next week
export async function schedule(week = 1, preferences, callback) {
	console.log('Scheduling...');
	db.serialize(() => {
		db.all('SELECT * FROM User', async (err, users) => {
			if (err) {
				console.log(err);
				return res.status(500).json({ message: err.message });
			}
			if (users.length !== 1) {
				console.log('Users found: ' + users.length);
				if (callback) callback(401, 'User not found.');
				return;
			}

			// get hours for the week
			const [sunday, saturday] = getWeekBounds(getEasternTime(week ? new Date + 604800000 : new Date)); // 604800000 = 7 days in case week is 1
			db.all(`
                SELECT * FROM Hour
                WHERE (Year = ${sunday.getFullYear()} OR Year = ${saturday.getFullYear()})
                AND (Month = ${sunday.getMonth() + 1} OR Month = ${saturday.getMonth() + 1})
                AND Day >= ${sunday.getDate()} AND Day <= ${saturday.getDate()}
            `, async (err, hours) => {
				if (err) {
					console.log(err);
					return res.status(500).json({ message: err.message });
				}
				if (!hours.length) {
					if (callback) callback(204, 'No hours found.');
					return;
				}

				console.log(hours);
				try {
					// start puppeteer
					const browser = await puppeteer.launch({ headless: PUPPETEER_HEADLESS });
					const page = await browser.newPage();
					await page.goto(URL_SCHEDULE);
					// await page.waitForNavigation();
					await sleep(1000);

					if (!(await page.$('.ScheduleManagerLink'))) { // if not logged in
						await page.waitForSelector('#ctl00_ctl00_phContentMain_phContentMain_btnSubmit');
						await page.type('#ctl00_ctl00_phContentMain_phContentMain_tbxUser', users[0].Username);
						await page.type('#ctl00_ctl00_phContentMain_phContentMain_tbxPass', users[0].Password);
						await sleep(1000);
						await page.click('#ctl00_ctl00_phContentMain_phContentMain_btnSubmit');
						// await page.waitForNavigation();
					}

					if (preferences) { // wait for the hour to schedule
						const { HourToSchedule, DayToSchedule } = preferences;
						const interval = setInterval(async () => {
							const date = new Date(getEasternTime() - SHCEDULE_DELAY);
							if (date.getHours() === HourToSchedule && date.getDay() === DayToSchedule) {
								clearInterval(interval);
								await finishSchedule(page, browser, users, hours, week, callback);
							}
						}, 1000);
					} else { // schedule immediately
						await finishSchedule(page, browser, users, hours, week, callback);
					}
				} catch (err) {
					console.log(err);
					if (callback) callback(500, err.message);
				}
			});
		});
	});
}

async function finishSchedule(page, browser, users, hours, week, callback) {
	try {
		await page.click('.ScheduleManagerLink');
		const target = await browser.waitForTarget(target => target.opener() === page.target());

		// get the new page
		// const pages = await browser.pages();
		// const schedulePage = pages.at(-1);
		const schedulePage = await target.page();
		console.log(schedulePage.url());

		// await schedulePage.waitForSelector('#cell0', { timeout: 2000 });
		if (!(await schedulePage.$('#cell0'))) { // if need to login again
			console.log('Logging in again...');
			await schedulePage.waitForSelector('#butSignIn');
			await schedulePage.type('#txtUserName', users[0].Username);
			await schedulePage.type('#txtPassword', users[0].Password);
			await sleep(1000);
			await schedulePage.click('#butSignIn');
			// await schedulePage.waitForNavigation();
		}

		// assuming the schedule is set to the next week
		if (week === 1) {
			await schedulePage.waitForSelector('[name="weekAhead"]');
			await sleep(1000);
			await schedulePage.click('[name="weekAhead"]');
			// await schedulePage.waitForNavigation();
			await sleep(1000);
		}

		let count = 0;
		hours.forEach(async ({ Year, Month, Day, Hour }, index) => {
			console.log(`${Year}/${Month}/${Day} ${Hour}:00...`);
			try {
				const date = getEasternTime(new Date(`${Year}/${Month}/${Day}`));

				const sel = `#cell${date.getDay() + 7 * Hour}`;
				await schedulePage.waitForSelector(sel);
				await schedulePage.click(sel);

				const unavailable = await schedulePage.evaluate(() => (
					document.querySelector('#butProviderSchedule').disabled
				));
				if (unavailable) {
					console.log('... unavailable');
				}
				else {
					await schedulePage.click('#butProviderSchedule');
					await sleep(1000);
					// await schedulePage.waitForNavigation();
					count++;
				}

				if (index === hours.length - 1) {
					// await schedulePage.close();
					// await browser.close();
					console.log(`Scheduled ${count} hours from ${hours.length}`);
					if (callback) callback(200, `Scheduled ${count} hours from ${hours.length}`);
				}
			} catch (err) {
				console.log(err);
			}
		});
	} catch (err) {
		console.log(err);
		if (callback) callback(500, err.message);
	}
}

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

const db = new (sqlite3.verbose().Database)(DB_PATH);
