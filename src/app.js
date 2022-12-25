import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import createError from 'http-errors';

import indexRouter from './routes/index.routes.js';
import usersRouter from './routes/user.routes.js';
import hoursRouter from './routes/hour.routes.js';
import weeksRouter from './routes/week.routes.js';

import setSchedule from './helpers/schedule.js';
import { loadPreferences } from './helpers/preferences.js';
import initDB from './initDB.js';

// app setup

const app = express();

app.set('json spaces', 2);
app.use(morgan('dev'));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// routes
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/hours', hoursRouter);
app.use('/weeks', weeksRouter);

// catch 404 and forward to error handler
app.use((req, res, next) => {
	next(createError(404));
});

// error handler
app.use((req, res, next) => {
	// set locals, only providing error in development
	// res.locals.message = err.message;
	// res.locals.error = req.app.get('env') === 'development' ? err : {};

	// render the error page
	// res.status(err.status || 500);
	res.status(404).json({ message: 'Not found' });
});

initDB(() => loadPreferences(app, () => setSchedule(app)));

export default app;
