import sqlite3 from 'sqlite3';
import { DB_PATH } from '../constants.js';

export default function (req, res, next) {
    return next();
    db.serialize(() => {
        db.all('SELECT * FROM User', (err, users) => {
            if (err) {
				console.log(err);
				return res.status(500).render('error', { message: err.message });
			}
            if(users.length !== 1) {
				return res.status(302).redirect('login');
			}
            req.user = users[0].Username;
            next();
        });
    });
}

const db = new (sqlite3.verbose().Database)(DB_PATH);
