var createError = require('http-errors');
var express = require('express');
const bodyParser = require('body-parser')
var logger = require('morgan');
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('example.db');

db.serialize(function() {

 // Create user table
 db.run("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, username TEXT, password TEXT)");
 // Create hour table
 db.run("CREATE TABLE IF NOT EXISTS hours (id INTEGER PRIMARY KEY, username TEXT, year INTEGER, month INTEGER, week INTEGER, day INTEGER, hour INTEGER)");

});

db.close();
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

// view engine setup


app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
    extended: true
}))


app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.send('error');
});

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
