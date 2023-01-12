import path from 'path';
import { fileURLToPath } from 'url';

export const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const DB_PATH = path.join(__dirname, '../', 'db', 'db.sqlite3');

export const SCHEDULE_INTERVAL = 'scheduleInterval';
export const SCHEDULE_TIMEOUT = 'scheduleTimeout';

export const URL_SCHEDULE = 'https://www.tutor.com/providers/schedule';
export const URL_BILLING = 'https://prv.tutor.com/nGEN/Apps/SocWinSupportingPages/Provider/BillingInfo.aspx?ProgramGUID=b611858b-4d02-4afe-8053-d082bbc1c58e';
export const URL_RATING = 'https://prv.tutor.com/nGEN/Apps/SocWinSupportingPages/Provider/ConnectionInfo.aspx?ProgramGUID=b611858b-4d02-4afe-8053-d082bbc1c58e';
export const URL_USD = 'https://www.google.com/finance/quote/USD-COP';
