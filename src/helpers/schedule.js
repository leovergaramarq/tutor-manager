import puppeteer from 'puppeteer';
import sqlite3 from 'sqlite3';
import { DB_PATH, URL_SCHEDULE } from '../constants.js';
import { defPreferences } from './preferences.js';
import { getWeekBounds } from './week.js';
import {
	DEADLINE_MINUTES_TO_SCHEDULE, PUPPETEER_HEADLESS, SCHEDULE_ANTICIPATION, SCHEDULE_DELAY
} from '../config.js';

export default function setSchedule() {
	console.log('Setting schedule...');
	clearInterval(intervalWeekly);
	clearTimeout(timeoutSetSched);
	clearTimeout(timeoutFinishSched);
	
	db.serialize(() => {
		db.all('SELECT * FROM Preference', (err, rows) => {
			if (err) {
				return console.log('Could not load preferences from database. Using default values.');
			}
			const preferences = rows.length ? rows[0] : defPreferences();
			console.log('Preferences', preferences);
			const { HourToSchedule: hourToSchedule, DayToSchedule: dayToSchedule } = preferences;

			const date = new Date();
			const dateSched = dateToSchedule(date, dayToSchedule, hourToSchedule);
			// console.log('localDate', date);
			// console.log('localDateSched', dateSched);

			if ((date - dateSched) / 60000 > DEADLINE_MINUTES_TO_SCHEDULE) { // if the hour to schedule is in the past, schedule for next week
				dateSched.setDate(dateSched.getDate() + 7);
			}

			// clearTimeout(timeoutSetSched);
			timeoutSetSched = setTimeout(() => {
				timeoutSetSched = null;

				// clearInterval(intervalWeekly);
				intervalWeekly = setInterval(() => { //reset after 7 days
					schedule(1, dateSched);
				}, 604800000);

				console.log(`Unwanted delay: ${(new Date() - date) / 1000}s`);
				schedule(1, dateSched);
			}, (dateSched - date) - SCHEDULE_ANTICIPATION);

			const milisToSched = ((dateSched - date) - SCHEDULE_ANTICIPATION);
			const days = milisToSched / 86400000;
			const hours = (days - parseInt(days)) * 24;
			const minutes = (hours - parseInt(hours)) * 60;
			console.log(`Scheduling will take place within ${parseInt(days)} days, ${parseInt(hours)} hours, ${minutes.toFixed(2)} minutes.`);
		});
	});
}

// week = 0 for this week, 1 for next week
export async function schedule(week = 1, dateSched, callback) {
	console.log('Scheduling...');
	clearTimeout(timeoutFinishSched);
	
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

			db.all('SELECT * FROM Hour', async (err, hours) => {
				if (err) {
					console.log(err);
					return res.status(500).json({ message: err.message });
				}
				// get hours for the week
				const [sunday, saturday] = getWeekBounds(week ? new Date(new Date().getTime() + 604800000) : new Date()); // 604800000 = 7 days in case week is 1
				const now = new Date();

				// filter hours
				hours = hours.filter(({ Year, Month, Day, Hour }) => {
					const hourToSched = new Date(`${Year}/${Month}/${Day} ${Hour}:00`);
					return hourToSched >= sunday && hourToSched <= saturday && hourToSched >= now;
				});

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

					if (dateSched) { // wait for the hour to schedule
						const date = new Date();

						// clearTimeout(timeoutFinishSched);
						timeoutFinishSched = setTimeout(() => {
							timeoutFinishSched = null;
							finishSchedule(page, browser, users, hours, week, callback);
						}, (dateSched - date) + SCHEDULE_DELAY);

					} else { // schedule immediately
						finishSchedule(page, browser, users, hours, week, callback);
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
			try {
				const date = new Date(`${Year}/${Month}/${Day}`);

				const sel = `#cell${date.getDay() + 7 * Hour}`;
				await schedulePage.waitForSelector(sel);
				await schedulePage.click(sel);

				const unavailable = await schedulePage.evaluate(() => (
					document.querySelector('#butProviderSchedule').disabled
				));
				console.log(`${Year}/${Month}/${Day} ${Hour}:00 - ${unavailable ? 'unavailable' : 'available'}`);
				if (!unavailable) {
					await schedulePage.click('#butProviderSchedule');
					await sleep(1000);
					// await schedulePage.waitForNavigation();
					count++;
				}

				if (index === hours.length - 1) {
					// await schedulePage.close();
					// await browser.close();
					console.log(`Scheduled hours: ${count}/${hours.length}`);
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

function dateToSchedule(date, dayToSchedule, hourToSchedule) {
	const day = date.getDate() + (dayToSchedule - date.getDay() + 7) % 7;
	const hour = hourToSchedule;

	const dateSched = new Date(date);
	dateSched.setDate(day);
	dateSched.setHours(hour, 0, 0, 0);

	return dateSched;
}

function clearInterval(interval) {
	if (interval) {
		console.log('Clearing interval', interval);
		global.clearInterval(interval);
		interval = null;
	}
}

function clearTimeout(timeout) {
	if (timeout) {
		console.log('Clearing timeout', timeout);
		global.clearTimeout(timeout);
		timeout = null;
	}
}

const db = new (sqlite3.verbose().Database)(DB_PATH);
let timeoutSetSched, intervalWeekly, timeoutFinishSched;
