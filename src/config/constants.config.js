import path from "path";

export const __dirname = process.execPath.endsWith("tutor-manager.exe")
    ? path.join(process.execPath, "..")
    : process.cwd();

export const DB_PATH = path.join(__dirname, "db", "db.sqlite3");

export const SCHEDULE_INTERVAL = "scheduleInterval";
export const SCHEDULE_TIMEOUT = "scheduleTimeout";

export const URL_SCHEDULE =
    "https://prv.tutor.com/nGEN/Tools/ScheduleManager_v2/setContactID.aspx?ProgramGUID=B611858B-4D02-4AFE-8053-D082BBC1C58E&UserGUID=3e8c683c-aece-4f72-b69b-d2d5081dc952";
export const URL_BILLING =
    "https://prv.tutor.com/nGEN/Apps/SocWinSupportingPages/Provider/BillingInfo.aspx?ProgramGUID=b611858b-4d02-4afe-8053-d082bbc1c58e";
// export const URL_RATING =
//     "https://prv.tutor.com/nGEN/Apps/SocWinSupportingPages/Provider/ConnectionInfo.aspx?ProgramGUID=b611858b-4d02-4afe-8053-d082bbc1c58e";
export const URL_USD = "https://www.google.com/finance/quote/USD-COP";
// export const URL_TIME_IS = "https://time.is";
export const LOCAL_TIMEZONE = Intl.DateTimeFormat().resolvedOptions().timeZone;
export const URL_WORLD_TIME_API = `https://worldtimeapi.org/api/timezone/${LOCAL_TIMEZONE}`;

export const SCHEDULE_BY_ADDING = 0;
export const SCHEDULE_BY_AREA = 1;
