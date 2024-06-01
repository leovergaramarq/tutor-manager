import { LOCAL_TIMEZONE, TIME_DIFF } from "../config/general.config.js";

export function getDateSync(...args) {
    const date = new Date(...args);
    date.setTime(date.getTime() + TIME_DIFF);
    return date;
}

export function getWeekBounds(date = new Date()) {
    const day = date.getDay();

    const sunday = new Date(date);
    sunday.setDate(date.getDate() - day);
    sunday.setHours(0, 0, 0, 0);

    const saturday = new Date(date);
    saturday.setDate(date.getDate() + (6 - day));
    saturday.setHours(23, 59, 59, 999);

    return [sunday, saturday];
}

export function getWeekMatrix() {
    return Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => 0));
}

export function getLocalTime(date = new Date()) {
    return getDateSync(
        date.toLocaleString("en-US", {
            timeZone: LOCAL_TIMEZONE
        })
    );
}

export function getDateFromSunday(sunday, dayOfWeek, hour) {
    const date = new Date(sunday);
    date.setDate(sunday.getDate() + dayOfWeek);
    date.setHours(hour);

    return date;
}

export function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
