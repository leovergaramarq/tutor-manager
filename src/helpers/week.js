// function that gets the sunday and saturday of the week of a given date
export function getWeekBounds (date=getEasternTime(new Date())) {
    const day = date.getDay();
    const sunday = new Date(date);
    sunday.setDate(date.getDate() - day);
    const saturday = new Date(date);
    saturday.setDate(date.getDate() + (6 - day));
    return [sunday, saturday];
}

export function weekMatrix () {
    return Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => 0));
}

export function getEasternTime(date=new Date()) {
    return new Date(date.toLocaleString('en-US', { timeZone: 'America/New_York' }));
}
