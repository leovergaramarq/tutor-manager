var express = require('express');
var router = express.Router();
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('example.db');


/* GET home page. */


router.get('/set', function(req, res, next) {

});

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


router.post('/get', function(req, res, next) {
  const {username, password} = req.body
  console.log(username)
  let obj = []
  db.serialize(function() {
  db.all(`SELECT * FROM users  where username='${username}'`, function(err, rows) {
    rows.forEach(row =>{
      obj.push(row.password)
    })
    res.send(obj)
   });
  });
  
  db.close();

});

router.post('/addhour', function(req, res, next) {
  const {username, year, month, week, day, hour} = req.body
  let obj = []
  db.run(`INSERT INTO hours(username, year, month, week, day, hour) VALUES(?,?,?,?,?,?)`, [username, year, month, week, day, hour], function(err) {
    if (err) {
      return console.log(err.message);
    }
    // get the last insert id
    console.log(`A row has been inserted with rowid ${this.lastID}`);
    res.send('hour added')
  });

  // close the database connection
  db.close();
});

router.post('/gethour', function(req, res, next) {
  const {username} = req.body
  let obj = []
  db.all(`SELECT * FROM hours  where username='${username}'`, function(err, rows) {
    rows.forEach(row =>{
      obj.push(row)
    })
    res.send(obj)
   });

  // close the database connection
  db.close();
});

module.exports = router;
