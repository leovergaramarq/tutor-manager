import { config } from 'dotenv';

config();

// env variables
export const PORT = process.env.PORT || 5000;

export const HOUR_TO_SCHEDULE = 12;
export const DAY_TO_SCHEDULE = 6;
export const SCHEDULE_ANTICIPATION = 60000; // begin scrapping 1 minute before the hour
export const SCHEDULE_DELAY = 1000; // schedule 1 second after the hour (to avoid scheduling conflicts)
export const SCHEDULE_METHOD = 0; // 0 = adding, 1 = area
export const SCHEDULE_PREFERRED_HOURS = 0; // 0 = no (use table Hour), 1 = yes (use table PreferredHour)

export const DEADLINE_MINUTES_TO_SCHEDULE = 60; // schedule if 60 mimnutes have passed since the hour

export const PUPPETEER_HEADLESS = false;

process.env.TZ = 'America/New_York';
