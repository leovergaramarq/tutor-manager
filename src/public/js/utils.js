export function getEasternGMT() {
    return getEasternTime().getHours() - +new Date().toUTCString().split(' ')[4].split(':')[0];
}

export function getEasternTime(date = new Date()) {
    return new Date(date.toLocaleString('en-US', {
        timeZone: 'America/New_York',
        // timeZone: 'Europe/Madrid',
    }));
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

export function getDateToSchedule(date, dayToSchedule, hourToSchedule, deadlineMinutesToSchedule) {
	const day = date.getDate() + (dayToSchedule - date.getDay() + 7) % 7;
	const hour = hourToSchedule;

	const dateSched = new Date(date);
	dateSched.setDate(day);
	dateSched.setHours(hour, 0, 0, 0);

	if ((date - dateSched) / 60000 > deadlineMinutesToSchedule) { // if the hour to schedule is in the past, schedule for next week
		dateSched.setDate(dateSched.getDate() + 7);
	}

	return dateSched;
}
