BEGIN TRANSACTION;
CREATE TABLE IF NOT EXISTS "User" (
	"UserID"	INTEGER NOT NULL UNIQUE,
	"Username"	TEXT NOT NULL UNIQUE,
	"Password"	TEXT NOT NULL,
	PRIMARY KEY("UserID" AUTOINCREMENT),
	UNIQUE("Username")
);
CREATE TABLE IF NOT EXISTS "Hour" (
	"HourID"	INTEGER NOT NULL UNIQUE,
	"Year"	INTEGER NOT NULL,
	"Month"	INTEGER NOT NULL,
	"Day"	INTEGER NOT NULL,
	"Hour"	INTEGER NOT NULL,
	PRIMARY KEY("HourID" AUTOINCREMENT)
);
CREATE TABLE IF NOT EXISTS "Preference" (
	"HourToSchedule"	INTEGER NOT NULL DEFAULT 12,
	"DayToSchedule"	INTEGER DEFAULT 6,
	"KeepLogin"	INTEGER DEFAULT 0
);
COMMIT;
