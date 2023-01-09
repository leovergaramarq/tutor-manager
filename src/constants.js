import path from 'path';
import { fileURLToPath } from 'url';

export const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const DB_PATH = path.join(__dirname, '../', 'db', 'db.sqlite3');

export const SCHEDULE_INTERVAL = 'scheduleInterval';
export const SCHEDULE_TIMEOUT = 'scheduleTimeout';

export const URL_SETTINGS = 'https://www.tutor.com/providers/ic/settings';
export const URL_SCHEDULE = 'https://www.tutor.com/providers/schedule';
