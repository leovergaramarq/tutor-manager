import { config } from 'dotenv';

config();

// env variables
export const PORT = process.env.PORT || 5000;

export const HOUR_TO_SCHEDULE = 12;
export const DAY_TO_SCHEDULE = 6;
export const KEEP_LOGIN = 0;
export const DEADLINE_MINUTES_TO_SCHEDULE = 60;

export const SCHEDULE_ANTICIPATION = 60000; // begin scrapping 1 minute before the hour
export const SCHEDULE_DELAY = 1000; // schedule 1 second after the hour (to avoid scheduling conflicts)

export const PUPPETEER_HEADLESS = false;

process.env.TZ = 'America/New_York';
