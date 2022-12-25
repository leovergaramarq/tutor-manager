import puppeteer from 'puppeteer';
import sqlite3 from 'sqlite3';
import { DB_PATH } from '../constants.js';
import {
    DAY_TO_SCHEDULE,
    HOUR_TO_SCHEDULE,
    SCHEDULE_INTERVAL,
    SCHEDULE_TIMEOUT,
    URL_SCHEDULE
} from '../constants.js';
import { elementExists } from './dom.js';
import { getWeekBounds, getEasternTime } from './week.js';

export default function setSchedule(app) {
    const anticipation = 120000;

    app.set(SCHEDULE_INTERVAL, setInterval(async () => {
        const date = getEasternTime() + anticipation; // Begin scheduling 2 minutes before the hour
        if (date.getHours() === app.get(HOUR_TO_SCHEDULE) && date.getDay() === app.get(DAY_TO_SCHEDULE)) {
            clearInterval(interval);
            app.set(SCHEDULE_INTERVAL, null);

            app.set(SCHEDULE_TIMEOUT, setTimeout(() => {
                console.log('Resetting interval...');
                app.set(SCHEDULE_TIMEOUT, null);
                setSchedule(app);
            }, 3600000 + anticipation));

            schedule(1);
        }
    }, 1000));
}

export async function schedule(week=1, callback) { // week = 0 for this week, 1 for next week
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
            const [sunday, saturday] = getWeekBounds(getEasternTime(new Date() + 604800000)); // next week
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
                    const browser = await puppeteer.launch();
                    const page = await browser.newPage();
                    await page.goto(URL_SCHEDULE);

                    if (!(await page.$('.ScheduleManagerLink'))) { // if not logged in
                        // await page.waitForSelector('#ctl00_ctl00_phContentMain_phContentMain_btnSubmit');
                        await page.type('#ctl00_ctl00_phContentMain_phContentMain_tbxUser', users[0].Username);
                        await page.type('#ctl00_ctl00_phContentMain_phContentMain_tbxPassword', users[0].Password);
                        await page.click('#ctl00_ctl00_phContentMain_phContentMain_btnSubmit');
                        await page.waitForNavigation();
                    }
                    await page.waitForSelector('.ScheduleManagerLink');

                    // wait for the hour to schedule
                    const delay = 0;
                    const interval = setInterval(async () => {
                        const date = getEasternTime() - delay; // Prudent time delay to avoid scheduling too early
                        if (date.getHours() === app.get(HOUR_TO_SCHEDULE) && date.getDay() === app.get(DAY_TO_SCHEDULE)) {
                            clearInterval(interval);

                            try {
                                await page.click('.ScheduleManagerLink');
                                await page.waitForNavigation();
                                // await sleep(1000);

                                // get the new page
                                const schedulePage = (await browser.pages()).at(-1);
                                console.log(schedulePage.url());

                                if (!(await schedulePage.$('#cell0'))) { // if need to login again
                                    await schedulePage.type('#txtUserName', users[0].Username);
                                    await schedulePage.type('#txtPassword', users[0].Password);
                                    // await schedulePage.waitForSelector('#butSignIn');
                                    await schedulePage.click('#butSignIn');
                                    await schedulePage.waitForNavigation();
                                }

                                // assuming the schedule is set to the next week
                                if(week === 1) {
                                    await schedulePage.waitForSelector('[name="weekAhead"]');
                                    await schedulePage.click('[name="weekAhead"]');
                                    await schedulePage.waitForNavigation();
                                }
                                
                                let count = 0;
                                hours.forEach(async ({ Year, Month, Day, Hour }) => {
                                    console.log(`${Year}/${Month}/${Day} ${Hour}:00`);
                                    try {
                                        const date = getEasternTime(new Date(`${Year}/${Month}/${Day}`));
                                        await schedulePage.click(`#cell${date.getDay() + 7 * Hour}`);
                                        const unavailable = await schedulePage.evaluate(() => (
                                            document.querySelector('#butProviderSchedule').disabled
                                        ));
                                        if (unavailable) return console.log('Unavailable');
    
                                        await schedulePage.click('#butProviderSchedule');
                                        // await sleep(1000);
                                        await schedulePage.waitForNavigation();

                                        count++;
                                    } catch (err) {
                                        console.log(err);
                                    }
                                });
                            } catch (err) {
                                console.log(err);
                                if (callback) callback(500, err.message);
                            }

                            if(callback) callback(200, `Scheduled ${count} hours from ${hours.length}`);
                        }
                    }, 1000);
                } catch (err) {
                    console.log(err);
                    if (callback) callback(500, err.message);
                }
            });
        });
    });

}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const db = new (sqlite3.verbose().Database)(DB_PATH);
