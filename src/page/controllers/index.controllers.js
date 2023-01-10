import sqlite3 from 'sqlite3';
import { DB_PATH } from "../../constants.js";
import { getDateToSchedule } from '../../helpers/schedule.js';

export default function (req, res) {
    res.status(200).render('home', {
        _title: 'Home | Tutor Manager',
        _styles: ['/css/home.css'],
        user: req.user
    });
    // db.serialize(() => {
	// 	db.all('SELECT * FROM Preference', (err, rows) => {
    //         let dateToSchedule;
            
	// 		if (err) {
	// 			console.log(err);
	// 		} else {
    //             const {
    //                 HourToSchedule: hourToSchedule,
    //                 DayToSchedule: dayToSchedule
    //             } = rows[0];
    //             dayToSchedule = getDateToSchedule(new Date(), dayToSchedule, hourToSchedule);
    //         }
            
	// 	});
	// })
}

const db = new (sqlite3.verbose().Database)(DB_PATH);
