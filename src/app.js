import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import hbs from 'express-handlebars';
import path from 'path';

import apiRouter from './api/routes/index.routes.js';
import pageRouter from './page/routes/index.routes.js';
import setSchedule from './helpers/schedule.js';
import preferences from './helpers/preferences.js';
import initDB from './helpers/initDB.js';

import { __dirname } from './constants.js';

// app setup

const app = express();

app.set('json spaces', 2);
app.use(morgan('dev'));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// view engine setup
app.set('views', path.join(__dirname, 'page', 'views'));
app.engine(
	'.hbs',
	hbs.create({
		layoutsDir: path.join(app.get('views'), 'layouts'),
		partialsDir: path.join(app.get('views'), 'partials'),
		defaultLayout: 'main',
		extname: '.hbs',
	}).engine
);
app.set('view engine', '.hbs');

// routes
app.use('/api', apiRouter);
app.use('/', pageRouter);

// error handler
// app.use((_, res) => res.status(404).render('404'));

initDB(err => {
	console.log('Initializing database...');
	if (err) {
		console.log('ERROR: Database not initialized.');
		return console.log(err);
	}
	console.log('Initializing preferences...');
	preferences(err => {
		if (err) {
			console.log('ERROR: Couldn\'t read preferences.');
			return console.log(err);
		}
		console.log('Programming schedule...');
		setSchedule();
	});
});

export default app;
