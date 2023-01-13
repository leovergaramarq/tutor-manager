import puppeteer from 'puppeteer';
import sqlite3 from 'sqlite3';
import { DB_PATH, URL_SCHEDULE } from '../constants.js';
import { defPreferences } from './preferences.js';
import { save as saveCookies } from './cookies.js';
import sleep from './sleep.js';
import { getWeekBounds } from './week.js';

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
				DeadlineMinutesToSchedule: deadlineMinutesToSchedule,
				PuppeteerHeadless: puppeteerHeadless
			} = preferences;

			const date = new Date();
			const dateSched = getDateToSchedule(date, dayToSchedule, hourToSchedule, deadlineMinutesToSchedule);

			// clearTimeout(timeoutSetSched);
			timeoutSetSched = setTimeout(() => {
				timeoutSetSched = null;

				// clearInterval(intervalWeekly);
				intervalWeekly = setInterval(() => { //reset after 7 days
					schedule(1, dateSched, {
						scheduleDelay, scheduleMethod, schedulePreferredHours, puppeteerHeadless
					});
				}, 604800000);

				console.log(`Unwanted delay: ${(new Date() - date) / 1000}s`);
				schedule(1, dateSched, {
					scheduleDelay, scheduleMethod, schedulePreferredHours, puppeteerHeadless
				});
			}, (dateSched - date) - scheduleAnticipation);

			const milisToSched = (dateSched - date) - scheduleAnticipation;

			if (milisToSched <= 0) {
				console.log('Scheduling now...');
			} else {
				const days = milisToSched / 86400000;
				const hours = (days - Math.floor(days)) * 24;
				const minutes = (hours - Math.floor(hours)) * 60;
				console.log(`Scheduling will take place within ${Math.floor(days)} days, ${Math.floor(hours)} hours, ${minutes.toFixed(2)} minutes.`);
			}
		});
	});
}

// week = 0 for this week, 1 for next week
export async function schedule(week = 1, dateSched, preferences, callback) {
	if (week < 0 || week > 1) {
		if (callback) callback(400, 'Invalid week.');
		return;
	}

	console.log('Scheduling...');
	clearTimeout(timeoutFinishSched);

	db.serialize(() => {
		db.all('SELECT * FROM User', async (err, users) => {
			if (err) {
				console.log(err);
				return res.status(500).json({ message: err.message });
			}
			if (users.length !== 1) {
				if (callback) callback(401, 'User not found.');
				return console.log('Users found: ' + users.length);
			}

			const { scheduleDelay, scheduleMethod, schedulePreferredHours } = preferences;

			db.all(schedulePreferredHours ? 'SELECT * FROM PreferredHour' : 'SELECT * FROM Hour', async (err, hours) => {
				if (err) {
					console.log(err);
					return res.status(500).json({ message: err.message });
				}
				// console.log(hours);
				// get hours for the week
				const now = new Date();
				const [sunday, saturday] = getWeekBounds(new Date(now.getTime() + week * 604800000)); // 604800000 = 7 days in case week is 1

				// filter hours by week and greater than now if schedulePreferredHours is false (using table Hour)
				if (schedulePreferredHours === 0) {
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
					if (callback) callback(200, 'No hours found.');
					return;
				}

				console.log(hours);
				try {
					// start puppeteer
					const browser = await puppeteer.launch({ headless: preferences.puppeteerHeadless ? true : false });
					const page = await browser.newPage();
					if (users[0].Cookies) {
						await page.setCookie(...JSON.parse(users[0].Cookies));
					}
					await page.goto(URL_SCHEDULE, { timeout: 0 });
					// await page.waitForNavigation();
					await sleep(1000);

					if (!(await page.$('#lblAvailableHours'))) { // if need to login again
						console.log('Logging in again...');
						await page.waitForSelector('#butSignIn');
						await page.type('#txtUserName', users[0].Username);
						await page.type('#txtPassword', users[0].Password);
						await sleep(500);
						// await page.waitForNavigation();
					}

					// if(callback) callback(200, 'Scheduling...'); // if scheduling takes too long, the connection will be closed

					if (dateSched) { // wait for the hour to schedule
						const date = new Date();

						// clearTimeout(timeoutFinishSched);
						timeoutFinishSched = setTimeout(() => {
							timeoutFinishSched = null;
							finishSchedule(page, hours, week, scheduleMethod, callback);
						}, (dateSched - date) + scheduleDelay);

					} else { // schedule immediately
						finishSchedule(page, hours, week, scheduleMethod, callback);
					}
				} catch (err) {
					console.log(err);
					if (callback) callback(500, err.message);
				}
			});
		});
	});
}

async function finishSchedule(page, hours, week, scheduleMethod, callback) {
	try {
		let newLogin;
		// if (!(await page.$('#cell0'))) { // continue login
		if (!(await page.$('#lblAvailableHours'))) { // continue login
			newLogin = true;
			await page.click('#butSignIn');
		} else {
			// refresh page
			await page.reload({ waitUntil: ["networkidle0", "domcontentloaded"] });
		}

		if (week === 1) {
			await page.waitForSelector('[name="weekAhead"]');
			await sleep(500);
			await page.click('[name="weekAhead"]');
			// await page.waitForNavigation();
			await sleep(1000);
		}

		await page.waitForSelector('#lblAvailableHours'); // wait for the page to load

		const count = scheduleMethod === 0 ? await scheduleByAdding(page, hours) : await scheduleByArea(page, hours);
		if(callback) callback(200, `Scheduled ${count}/${hours.length} hours.`);
		console.log(`Scheduled ${count}/${hours.length} hours.`);
		const cookies = await page.cookies();
		if (newLogin) saveCookies(cookies);
	} catch (err) {
		console.log(err);
	}
}

async function scheduleByAdding(page, hours) {
	const hoursAvailable = await page.evaluate(() => (
		+document.querySelector('#lblAvailableHours').textContent - +document.querySelector('#lblScheduledHours').textContent
	));
	if (!hoursAvailable) return 0;

	let count = 0;
	for (let i = 0; i < hours.length && count < hoursAvailable; i++) {
		try {
			const { Year, Month, Day, Hour } = hours[i];

			const dayOfWeek = Year ? new Date(`${Year}/${Month}/${Day}`).getDay() : Day; // if !Year then using table PreferredHour (Day is the day of week)

			const sel = `#cell${dayOfWeek + 7 * Hour}`;
			await page.waitForSelector(sel);
			const available = await page.$eval(sel, el => (
				el.classList.contains('ui-selecting-finished-OPERATING')
			));

			console.log(`${dayOfWeek} ${Hour}:00 - available: ${available}`);
			if (available) {
				await page.click(sel);
				await page.click('#butProviderSchedule');
				await sleep(1000);
				// await page.waitForNavigation();

				count += await page.$eval(sel, el => (
					el.classList.contains('ui-selecting-finished-FILLED')
				));
			}
		} catch (err) {
			console.log(err);
		}
	}
	return count;
}

async function scheduleByArea(page, hours) {
	console.log('Please do not hover over the interface'); // otherwise drag and drop will not work

	const hoursAvailable = await page.evaluate(() => (
		+document.querySelector('#lblAvailableHours').textContent - +document.querySelector('#lblScheduledHours').textContent
	));
	console.log('hoursAvailable', hoursAvailable);
	if (!hoursAvailable) return 0;

	const getScheduledHours = () => (
		[...document.querySelectorAll('.ui-selecting-finished-FILLED')].map(el => el.id)
	);

	try {
		await page.waitForSelector('#cell0');

		// 0. find hours already scheduled
		const previouslyScheduled = await page.evaluate(getScheduledHours);
		console.log('previouslyScheduled', previouslyScheduled);

		// 1. schedule the whole week simulating drag and drop
		const { mouse } = page;

		const isSaturday = new Date().getDay() === 6;

		let sel = isSaturday ? '#cell1' : '#cell0';
		await page.waitForSelector(sel);
		const cell1 = await page.$(sel); // if saturday, area should not cover sundays

		sel = '#cell167';
		await page.waitForSelector(sel);
		const cell167 = await page.$(sel);

		const box1 = await cell1.boundingBox();
		const box167 = await cell167.boundingBox();

		await mouse.move(box1.x + box1.width / 2, box1.y + box1.height / 2);
		await mouse.down();
		await mouse.move(box167.x + box167.width / 2, box167.y + box167.height / 2);
		await mouse.up();

		const available = await page.$eval('#butProviderSchedule', el => !el.disabled);

		if (available) {
			await page.click('#butProviderSchedule');
			console.log('Scheduling the whole week... (5s)');
			await sleep(5000);
		}

		// 2. unschedule the unwanted hours
		const scheduled = await page.evaluate(getScheduledHours); // get the hours scheduled after step 1
		console.log('scheduled', scheduled);

		const toUnschedule = scheduled.filter(id => {
			// 1. skip hours previously scheduled
			if (previouslyScheduled.includes(id)) return false;

			// 2. skip sundays if saturday
			const cellNum = +id.split('cell')[1];
			const dayOfWeek = cellNum % 7;
			if (isSaturday && dayOfWeek === 0) return false;

			// 3. skip hours not wanted
			const hourWanted = hours.find(({ Year, Month, Day, Hour }) => {
				if (Year) { // using table Hour
					const date = new Date(`${Year}/${Month}/${Day}`);
					return date.getDay() === dayOfWeek && Hour === Math.floor(cellNum / 7);
				} else {
					return Day === dayOfWeek && Hour === Math.floor(cellNum / 7);
				}
			});
			if (hourWanted) hourWanted.scheduled = true; // mark as scheduled
			return !hourWanted;
		});
		console.log('toUnschedule', toUnschedule);

		for (let i = 0; i < toUnschedule.length; i++) {
			try {
				await page.click('#' + toUnschedule[i]);
				await page.click('#butProviderUnschedule');
				await sleep(1000);
				// await page.waitForNavigation();
			} catch (err) {
				console.log(err);
			}
		}
	} catch (err) {
		console.log(err);
	}

	const unscheduled = hours.filter(hour => !hour.scheduled);
	let count = hours.length - unscheduled.length;
	if (unscheduled.length) {
		// schedule the missing hours
		console.log('Scheduling the missing hours...');
		count += await scheduleByAdding(page, unscheduled);
	}

	return count;
}

function getDateToSchedule(date, dayToSchedule, hourToSchedule, deadlineMinutesToSchedule) {
	const day = date.getDate() + (dayToSchedule - date.getDay() + 7) % 7;
	const hour = hourToSchedule;

	const dateSched = new Date(date);
	dateSched.setDate(day);
	dateSched.setHours(hour, 0, 0, 0);

	if ((date - dateSched) / 60000 > deadlineMinutesToSchedule) { // if the hour to schedule is in the past, schedule for next week
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
