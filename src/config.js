import { config } from 'dotenv';

config();

export const PORT = process.env.PORT || 3000;
export const NODE_ENV = process.env.NODE_ENV || 'development';

export const JWT_SECRET = process.env.JWT_SECRET || 'secret';
