import { Router } from 'express';
import sqlite3 from 'sqlite3';

const Database = sqlite3.verbose().Database;
const db = new Database('example.db');

const router = Router();

/* GET home page. */


router.get('/set', function (req, res, next) {

});

router.get('/get', function (req, res, next) {
	let obj = []
	db.serialize(function () {
		db.all("SELECT * FROM Foo", function (err, rows) {
			obj = rows
			res.status(200).json(obj)
		});
	});

	db.close();

});


router.post('/get', function (req, res, next) {
	const { username, password } = req.body
	console.log(username)
	let obj = []
	db.serialize(function () {
		db.all(`SELECT * FROM users  where username='${username}'`, function (err, rows) {
			rows.forEach(row => {
				obj.push(row.password)
			})
			res.status(200).json(obj)
		});
	});

	db.close();

});

router.post('/addhour', function (req, res, next) {
	const { username, year, month, week, day, hour } = req.body
	let obj = []
	db.run(`INSERT INTO hours(username, year, month, week, day, hour) VALUES(?,?,?,?,?,?)`, [username, year, month, week, day, hour], function (err) {
		if (err) {
			return console.log(err.message);
		}
		// get the last insert id
		console.log(`A row has been inserted with rowid ${this.lastID}`);
		res.status(200).json('hour added')
	});

	// close the database connection
	db.close();
});

router.post('/gethour', function (req, res, next) {
	const { username } = req.body
	let obj = []
	db.all(`SELECT * FROM hours  where username='${username}'`, function (err, rows) {
		rows.forEach(row => {
			obj.push(row)
		})
		res.status(200).json(obj)
	});

	// close the database connection
	db.close();
});

export default router;
