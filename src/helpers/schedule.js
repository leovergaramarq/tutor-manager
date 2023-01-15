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
					if (callback) callback(404, 'No hours found.');
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

					let newLogin;
					if (!(await page.$('#lblAvailableHours'))) { // if need to login again
						console.log('Logging in again...');
						await page.waitForSelector('#butSignIn');
						await page.type('#txtUserName', users[0].Username);
						await page.type('#txtPassword', users[0].Password);
						await sleep(100);
						await page.click('#butSignIn');
						newLogin = true;
						// await page.waitForNavigation();
					}

					// if(callback) callback(200, 'Scheduling...'); // if scheduling takes too long, the connection will be closed

					if (dateSched) { // wait for the hour to schedule
						const date = new Date();

						// clearTimeout(timeoutFinishSched);
						timeoutFinishSched = setTimeout(async () => {
							timeoutFinishSched = null;
							if (week) { // if next week, click next week button
								await page.waitForSelector('[name="weekAhead"]');
								// await sleep(500);
								await page.click('[name="weekAhead"]');
								// await page.waitForNavigation();
								await sleep(100);
							} else { // otherwise, reload page
								await page.reload({ waitUntil: ["networkidle0", "domcontentloaded"] });
							}
							finishSchedule(page, hours, scheduleMethod, newLogin, callback);
						}, (dateSched - date) + scheduleDelay);

					} else { // schedule immediately
						finishSchedule(page, hours, scheduleMethod, newLogin, callback);
					}
				} catch (err) {
					console.log(err);
					if (callback) callback(500, err.message);
				}
			});
		});
	});
}

async function finishSchedule(page, hours, scheduleMethod, newLogin, callback) {
	try {
		await page.waitForSelector('#lblAvailableHours'); // wait for the page to load
		const hoursAvailable = await getHoursAvailable(page);
		if (!hoursAvailable) {
			if (callback) callback(404, 'No hours available.');
			console.log('No hours available.');
		} else {
			const count = scheduleMethod === 0 ? await scheduleByAdding(page, hours) : await scheduleByArea(page, hours, hoursAvailable);
			if (callback) callback(200, `Scheduled ${count}/${hours.length} hours.`);
			console.log(`Scheduled ${count}/${hours.length} hours.`);
		}
		if (newLogin) saveCookies(await page.cookies());
	} catch (err) {
		console.log(err);
	}
}

async function scheduleByAdding(page, hours) {
	const toSchedule = hours.map(({ Year, Month, Day, Hour }) => (
		'cell' + ((Year ? new Date(`${Year}/${Month}/${Day}`).getDay() : Day) + 7 * Hour) // if !Year then using table PreferredHour (Day is the day of week)
	));

	let count = 0;
	try {
		await page.waitForSelector('#cell0');
		const { keyboard } = page;
		await keyboard.down('Control'); // hold control to select multiple hours
		// await Promise.allSettled(toSchedule.map(id => page.click('#' + id)));
		for (let i = 0; i < toSchedule.length; i++) {
			try {
				await page.click('#' + toSchedule[i]);
			} catch (err) { }
		}
		await keyboard.up('Control');
		const available = await page.$eval('#butProviderSchedule', el => !el.disabled);
		if (available) {
			await page.click('#butProviderSchedule');
			await waitForSomeButton(page, 5000);
		}

		console.log('looking for scheduled hours...');
		const scheduled = await page.evaluate(() => (
			[...document.querySelectorAll('.ui-selecting-finished-FILLED')].map(el => el.id)
		));
		console.log('scheduled', scheduled);
		scheduled.forEach(id => toSchedule.includes(id) && count++);
	} catch (err) {
		console.log(err);
	}
	return count;
}

async function scheduleByArea(page, hours, hoursAvailable) {
	console.log('Please do not hover over the interface'); // otherwise drag and drop will not work

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
			await waitForSomeButton(page, 5000);
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

		if (toUnschedule.length) {
			const selectToUnschedule = async i => {
				try {
					await page.click('#' + toUnschedule[i]);
				} catch (err) {
					console.log(err.message);
				}
			}

			await selectToUnschedule(0); // select first hour to undo previous selection
			const { keyboard } = page;
			await keyboard.down('Control'); // hold control to select multiple hours
			for (let i = 1; i < toUnschedule.length; i++) await selectToUnschedule(i);
			await keyboard.up('Control');

			await page.click('#butProviderUnschedule');
			await waitForSomeButton(page, 5000);
		}
	} catch (err) {
		console.log(err);
	}

	const toSchedule = hours.filter(hour => !hour.scheduled);
	let count = hours.length - toSchedule.length;
	if (toSchedule.length && count < hoursAvailable) {
		// schedule the missing hours
		console.log('Scheduling the missing hours...');
		count += await scheduleByAdding(page, toSchedule);
	}

	return count;
}

async function waitForSomeButton(page, timeout = 30000) {
	try {
		await page.waitForFunction(() => (
			!document.querySelector('#butProviderSchedule').disabled || !document.querySelector('#butProviderUnschedule').disabled // wait for either button to be enabled
		), { timeout });
		console.log('Waiting 5 seconds for buttons...');
	} catch (err) {
		console.log('Buttons not enabled');
	}
}

function getHoursAvailable(page) {
	return page.evaluate(() => (
		+document.querySelector('#lblAvailableHours').textContent - +document.querySelector('#lblScheduledHours').textContent
	))
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
