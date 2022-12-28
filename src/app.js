import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import createError from 'http-errors';

import indexRouter from './routes/index.routes.js';
import usersRouter from './routes/user.routes.js';
import hoursRouter from './routes/hour.routes.js';
import weeksRouter from './routes/week.routes.js';
import preferencesRouter from './routes/preference.routes.js';

import setSchedule from './helpers/schedule.js';
import preferences from './helpers/preferences.js';
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
app.use('/user', usersRouter);
app.use('/hours', hoursRouter);
app.use('/week', weeksRouter);
app.use('/preferences', preferencesRouter);

// catch 404 and forward to error handler
app.use((req, res, next) => {
	next(createError(404));
});

// error handler
app.use((_, res) => {
	// set locals, only providing error in development
	// res.locals.message = err.message;
	// res.locals.error = req.app.get('env') === 'development' ? err : {};

	// render the error page
	// res.status(err.status || 500);
	res.status(404).json({ message: 'Not found' });
});

initDB(err => {
	console.log('Initializing database...');
	if(err) {
		console.log('ERROR: Database not initialized.');
		return console.log(err);
	}
	console.log('Initializing preferences...');
	preferences(err => {
		if(err) {
			console.log('ERROR: Couldn\'t read preferences.');
			return console.log(err);
		}
		console.log('Programming schedule...');
		setSchedule(app);
	});
});

export default app;
