export const EASTERN_TIMEZONE = "America/New_York";

export function getTimezones() {
    const localTimezone = formatTimezone(
        Intl.DateTimeFormat().resolvedOptions().timeZone
    );
    const localDate = new Date();
    const localGmt = getGMT(localDate);

    const easternTimezone = formatTimezone(EASTERN_TIMEZONE);
    const easternDate = getEasternTime(localDate, localDate);
    const easternGmt = getGMT(easternDate, localDate);

    return {
        local: `${localTimezone} (GMT${localGmt})`,
        eastern: `${easternTimezone} (GMT${easternGmt})`
    };
}

function formatTimezone(timezone) {
    return timezone.split("/").reverse().join(", ").replace("_", " ");
}

function getGMT(date, utcDate = new Date()) {
    let dateHours = date.getHours();
    let utcHours = utcDate.getUTCHours();

    const dateDays = date.getDate();
    const utcDays = utcDate.getUTCDate();

    if (utcDays > dateDays) utcHours += 24;
    else if (utcDays < dateDays) dateHours += 24;

    const gmt = dateHours - utcHours;
    return gmt < 0 ? gmt : `+${gmt}`;
}

export function getEasternTime(date = new Date()) {
    return new Date(
        date.toLocaleString("en-US", {
            timeZone: EASTERN_TIMEZONE
        })
    );
}

export function getWeekBounds(week) {
    const date = getEasternTime();
    date.setDate(date.getDate() + 7 * week);

    const day = date.getDay();

    const sunday = new Date(date);
    sunday.setDate(date.getDate() - day);

    const saturday = new Date(date);
    saturday.setDate(date.getDate() + (6 - day));

    return [sunday, saturday];
}

export function getWeekMatrix() {
    return Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => 0));
}

export function getDateToSchedule(
    date,
    dayToSchedule,
    hourToSchedule,
    deadlineMinutesToSchedule
) {
    const day = date.getDate() + ((dayToSchedule - date.getDay() + 7) % 7);
    const hour = hourToSchedule;

    const dateSched = new Date(date);
    dateSched.setDate(day);
    dateSched.setHours(hour, 0, 0, 0);

    if ((date - dateSched) / 60000 > deadlineMinutesToSchedule) {
        // if the hour to schedule is in the past, schedule for next week
        dateSched.setDate(dateSched.getDate() + 7);
    }

    return dateSched;
}

export function showLoading({ belowNavbar } = {}) {
    const $loading = document.querySelector(".loading");
    if (belowNavbar) $loading.classList.add("below-navbar");
    $loading.classList.remove("hidden");
}

export function hideLoading() {
    document.querySelector(".loading").classList.add("hidden");
}
