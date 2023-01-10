export function getEasternGMT() {
    return getEasternTime().getHours() - +new Date().toUTCString().split(' ')[4].split(':')[0];
}

export function getEasternTime() {
    return new Date(new Date().toLocaleString('en-US', {
        timeZone: 'America/New_York',
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
