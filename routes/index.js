import { Router } from 'express';
import sqlite3 from 'sqlite3';
import jwt from 'jsonwebtoken';
import verifyToken from '../helpers/jwt.js';

const db = new (sqlite3.verbose().Database)('example.db');

const router = Router();


/* GET home page. */


router.get('/protegida', verifyToken, function(req, res, next) {
  console.log(req.user)
    res.send('acceso atorizado')
});

router.get('/generatetoken' , (req,res) => {
    const id  =  'leonardo'
    jwt.sign(id , 'secret_key' , (err,token) => {
      if(err){
          res.status(400).send({msg : 'Error'})
      }
  else {
          res.send({msg:'success' , token: token})
      }
    })
})

router.get('/get', function(req, res, next) {
  let obj = []
  db.serialize(function() {
  db.all("SELECT * FROM Foo", function(err, rows) {
    obj = rows
    res.send(obj)
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

router.post('/addhour', verifyToken, function(req, res, next) {
  const {year, month, week, day, hour} = req.body
  db.run(`INSERT INTO hours(username, year, month, week, day, hour) VALUES(?,?,?,?,?,?)`, [req.user, year, month, week, day, hour], function(err) {
    if (err) {
      return console.log(err.message);
    }
    res.send('hour added')
  });

	// close the database connection
	db.close();
});

router.post('/gethour', verifyToken, function(req, res, next) {
  let obj = []
  db.all(`SELECT * FROM hours  where username='${req.user}'`, function(err, rows) {
    rows.forEach(row =>{
      obj.push(row)
    })
    res.send(obj)
   });

	// close the database connection
	db.close();
});

export default router;
