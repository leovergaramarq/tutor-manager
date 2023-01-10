import puppeteer from 'puppeteer';
import sqlite3 from 'sqlite3';
import { DB_PATH, URL_SCHEDULE } from '../constants.js';
import { defPreferences } from './preferences.js';
import { getWeekBounds } from './week.js';
import {
	DEADLINE_MINUTES_TO_SCHEDULE, PUPPETEER_HEADLESS,
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
			const {
				HourToSchedule: hourToSchedule,
				DayToSchedule: dayToSchedule,
				ScheduleAnticipation: scheduleAnticipation,
				ScheduleDelay: scheduleDelay,
				ScheduleMethod: scheduleMethod,
				SchedulePreferredHours: schedulePreferredHours,
			} = preferences;

			const date = new Date();
			const dateSched = getDateToSchedule(date, dayToSchedule, hourToSchedule);

			// clearTimeout(timeoutSetSched);
			timeoutSetSched = setTimeout(() => {
				timeoutSetSched = null;

				// clearInterval(intervalWeekly);
				intervalWeekly = setInterval(() => { //reset after 7 days
					schedule(1, dateSched, scheduleDelay, scheduleMethod, schedulePreferredHours);
				}, 604800000);

				console.log(`Unwanted delay: ${(new Date() - date) / 1000}s`);
				schedule(1, dateSched, scheduleDelay, scheduleMethod, schedulePreferredHours);
			}, (dateSched - date) - scheduleAnticipation);

			const milisToSched = (dateSched - date) - scheduleAnticipation;
			
			if(milisToSched < 0) {
				console.log('Scheduling now...');
			} else {
				const days = milisToSched / 86400000;
				const hours = (days - parseInt(days)) * 24;
				const minutes = (hours - parseInt(hours)) * 60;
				console.log(`Scheduling will take place within ${parseInt(days)} days, ${parseInt(hours)} hours, ${minutes.toFixed(2)} minutes.`);
			}
		});
	});
}

// week = 0 for this week, 1 for next week
export async function schedule(week = 1, dateSched, scheduleDelay, scheduleMethod, schedulePreferredHours, callback) {
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

			db.all(schedulePreferredHours ? 'SELECT * FROM PreferredHour' : 'SELECT * FROM Hour' , async (err, hours) => {
				if (err) {
					console.log(err);
					return res.status(500).json({ message: err.message });
				}
				// get hours for the week
				const [sunday, saturday] = getWeekBounds(week ? new Date(new Date().getTime() + 604800000) : new Date()); // 604800000 = 7 days in case week is 1
				const now = new Date();

				// filter hours by week and greater than now if schedulePreferredHours is false (using table Hour)
				if(schedulePreferredHours === 0) {
					hours = hours.filter(({ Year, Month, Day, Hour }) => {
						const hourToSched = new Date(`${Year}/${Month}/${Day} ${Hour}:00`);
						return hourToSched >= sunday && hourToSched <= saturday && hourToSched >= now;
					});
				} else { // filter hours greater than now if schedulePreferredHours is true (using table PreferredHour)
					hours = hours.filter(({ Day, Hour }) => {
						const nowDayOfWeek = now.getDay();
						if (Day > nowDayOfWeek) return true;
						if (Day < nowDayOfWeek) return false;
						return Hour > now.getHours();
					});
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

					if (!(await page.$('.ScheduleManagerLink'))) { //if not logged in
						await page.waitForSelector('#ctl00_ctl00_phContentMain_phContentMain_btnSubmit');
						await page.type('#ctl00_ctl00_phContentMain_phContentMain_tbxUser', users[0].Username);
						await page.type('#ctl00_ctl00_phContentMain_phContentMain_tbxPass', users[0].Password);
						await sleep(1000);
						await page.click('#ctl00_ctl00_phContentMain_phContentMain_btnSubmit');
						// await page.waitForNavigation();
					}

					// if(callback) callback(200, 'Scheduling...'); // if scheduling takes too long, the connection will be closed

					if (dateSched) { // wait for the hour to schedule
						const date = new Date();

						// clearTimeout(timeoutFinishSched);
						timeoutFinishSched = setTimeout(() => {
							timeoutFinishSched = null;
							finishSchedule(page, browser, users, hours, week, scheduleMethod, callback);
						}, (dateSched - date) + scheduleDelay);

					} else { // schedule immediately
						finishSchedule(page, browser, users, hours, week, scheduleMethod, callback);
					}
				} catch (err) {
					console.log(err);
					if (callback) callback(500, err.message);
				}
			});
		});
	});
}

async function finishSchedule(page, browser, users, hours, week, scheduleMethod, callback) {
	try {
		await page.click('.ScheduleManagerLink');
		const target = await browser.waitForTarget(target => target.opener() === page.target());

		// get the new page
		const schedulePage = await target.page();
		console.log(schedulePage.url());

		if (!(await schedulePage.$('#cell0'))) { // if need to login again
			console.log('Logging in again...');
			await schedulePage.waitForSelector('#butSignIn');
			await schedulePage.type('#txtUserName', users[0].Username);
			await schedulePage.type('#txtPassword', users[0].Password);
			await sleep(1000);
			await schedulePage.click('#butSignIn');
			// await schedulePage.waitForNavigation();
		}

		if (week === 1) {
			await schedulePage.waitForSelector('[name="weekAhead"]');
			await sleep(1000);
			await schedulePage.click('[name="weekAhead"]');
			// await schedulePage.waitForNavigation();
			await sleep(1000);
		}

		await schedulePage.waitForSelector('#lblAvailableHours'); // wait for the page to load

		const count = scheduleMethod === 0 ? await scheduleByAdding(schedulePage, hours) : await scheduleByArea(schedulePage, hours);
		callback(200, `Scheduled ${count}/${hours.length} hours.`);
		console.log(`Scheduled ${count}/${hours.length} hours.`);

	} catch (err) {
		console.log(err);
	}
}

async function scheduleByAdding(schedulePage, hours) {
	const hoursAvailable = await schedulePage.evaluate(() => (
		+document.querySelector('#lblAvailableHours').textContent - +document.querySelector('#lblScheduledHours').textContent
	));
	if (!hoursAvailable) return 0;

	let count = 0;
	for (let i = 0; i < hours.length && count < hoursAvailable; i++) {
		try {
			const { Year, Month, Day, Hour } = hours[i];

			const dayOfWeek = Year ? new Date(`${Year}/${Month}/${Day}`).getDay() : Day; // if !Year then using table PreferredHour (Day is the day of week)

			const sel = `#cell${dayOfWeek + 7 * Hour}`;
			await schedulePage.waitForSelector(sel);
			const available = await schedulePage.$eval(sel, el => (
				el.classList.contains('ui-selecting-finished-OPERATING')
			));

			console.log(`${dayOfWeek} ${Hour}:00 - available: ${available}`);
			if (available) {
				await schedulePage.click(sel);
				await schedulePage.click('#butProviderSchedule');
				await sleep(1000);
				// await schedulePage.waitForNavigation();

				count += await schedulePage.$eval(sel, el => (
					el.classList.contains('ui-selecting-finished-FILLED')
				));
			}
		} catch (err) {
			console.log(err);
		}
	}
	return count;
}

async function scheduleByArea(schedulePage, hours) {
	const hoursAvailable = await schedulePage.evaluate(() => (
		+document.querySelector('#lblAvailableHours').textContent - +document.querySelector('#lblScheduledHours').textContent
	));
	if (!hoursAvailable) return 0;

	let count = 0;
	try {
		// 1. schedule the whole week
		const { mouse } = schedulePage;

		const cell1 = await schedulePage.$('#cell1');
		const cell167 = await schedulePage.$('#cell167');

		const box1 = await cell1.boundingBox();
		const box167 = await cell167.boundingBox();

		await mouse.move(box1.x + box1.width / 2, box1.y + box1.height / 2);
		await mouse.down();
		await mouse.move(box167.x + box167.width / 2, box167.y + box167.height / 2);
		await mouse.up();

		const available = await schedulePage.$eval('#butProviderSchedule', el => !el.disabled);

		if (available) {
			await schedulePage.click('#butProviderSchedule');
			console.log('Scheduling the whole week... (5s)');
			await sleep(5000);
		}

		// 2. unschedule the unwanted hours
		for (let i = 0; i <= 167; i++) {
			try {
				const dayOfWeek = i % 7;
				if (dayOfWeek !== 0) { // skip sundays
					const filled = await schedulePage.$eval(`#cell${i}`, el => (
						el.classList.contains('ui-selecting-finished-FILLED')
					));
					if (filled) {
						const hourWanted = hours.find(({ Year, Month, Day, Hour }) => {
							if (Year) { // using table Hour
								const date = new Date(`${Year}/${Month}/${Day}`);
								return date.getDay() === dayOfWeek && Hour === parseInt(i / 7);
							} else {
								return Day === dayOfWeek && Hour === parseInt(i / 7);
							}
						});
						if (!hourWanted) {
							await schedulePage.click(`#cell${i}`);
							await schedulePage.click('#butProviderUnschedule');
							await sleep(1000);
						} else {
							count++; // count the hours that are already scheduled
							hourWanted.scheduled = true;
						}
					}
				}
			} catch (err) {
				console.log(err);
			}
		}
	} catch (err) {
		console.log(err);
	}

	if (count < hours.length) {
		// 3. schedule the missing hours
		count += await scheduleByAdding(schedulePage, hours.filter(hour => !hour.scheduled));
	}

	return count;
}

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

export function getDateToSchedule(date, dayToSchedule, hourToSchedule) {
	const day = date.getDate() + (dayToSchedule - date.getDay() + 7) % 7;
	const hour = hourToSchedule;

	const dateSched = new Date(date);
	dateSched.setDate(day);
	dateSched.setHours(hour, 0, 0, 0);

	if ((date - dateSched) / 60000 > DEADLINE_MINUTES_TO_SCHEDULE) { // if the hour to schedule is in the past, schedule for next week
		dateSched.setDate(dateSched.getDate() + 7);
	}

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
