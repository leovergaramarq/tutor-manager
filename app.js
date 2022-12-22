import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import createError from 'http-errors';
import sqlite3 from 'sqlite3';

import indexRouter from './routes/index.js';
import usersRouter from './routes/users.js';

// database

const Database = sqlite3.verbose().Database;
const db = new Database('example.db');

db.serialize(() => {
	// Create user table
	db.run('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, username TEXT, password TEXT)');
	// Create hour table
	db.run('CREATE TABLE IF NOT EXISTS hours (id INTEGER PRIMARY KEY, username TEXT, year INTEGER, month INTEGER, week INTEGER, day INTEGER, hour INTEGER)');
});

db.close();

// app setup

const app = express();

app.set('spaces', 2);

app.use(morgan('dev'));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use((req, res, next) => {
	next(createError(404));
});

// error handler
app.use((err, req, res, next) => {
	// set locals, only providing error in development
	res.locals.message = err.message;
	res.locals.error = req.app.get('env') === 'development' ? err : {};

	// render the error page
	// res.status(err.status || 500);
	res.status(404).json({ message: 'Not found' });
});

// const PORT = process.env.PORT || 3000
// app.listen(PORT, () => {
// 	console.log(`Server listening on ${PORT}`);
// });

export default app;
