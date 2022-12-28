import { config } from 'dotenv';

config();

export const PORT = process.env.PORT || 3000;
export const NODE_ENV = process.env.NODE_ENV || 'development';

export const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export const JWT_EXPIRY_TIME = '24h';

export const HOUR_TO_SCHEDULE = 12;
export const DAY_TO_SCHEDULE = 6;
export const KEEP_LOGIN = 0;

export const SCHEDULE_ANTICIPATION = 60000; // begin scrapping 1 minute before the hour
export const SHCEDULE_DELAY = 1000; // schedule 1 second after the hour (to avoid scheduling conflicts)

export const PUPPETEER_HEADLESS = false;
