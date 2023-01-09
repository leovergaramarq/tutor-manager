import sqlite3 from 'sqlite3';
import { DB_PATH } from '../constants.js';

export function loggedIn(req, res, next) {
    db.serialize(() => {
        db.all('SELECT * FROM User', (err, users) => {
            if (err) {
                console.log(err);
                return res.status(500).render('error', { message: err.message });
            }
            if (users.length !== 1) {
                return res.status(302).redirect('login');
            }
            req.user = users[0].Username;
            next();
        });
    });
}

export function loggedOut(req, res, next) {
    db.serialize(() => {
        db.all('SELECT * FROM User', (err, users) => {
            if (err) {
                console.log(err);
                return res.status(500).render('error', { message: err.message });
            }
            if (users.length === 1) {
                return res.status(302).redirect('/');
            }
            next();
        });
    });
}

const db = new (sqlite3.verbose().Database)(DB_PATH);
