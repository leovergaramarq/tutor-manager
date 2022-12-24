import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const DB_PATH = path.join(__dirname, '../', 'db', 'db.sqlite3');

export const JWT_EXPIRY_TIME = '1hr';
