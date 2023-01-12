import fetch from './fetch.js';
import { getEasternGMT, getEasternTime, getWeekBounds, getWeekMatrix, getDateToSchedule } from './utils.js';

window.addEventListener('load', () => {
    // set remaining time
    fetch('/api/preferences')
        .then(({ status, data }) => {
            if (status !== 200) return console.error(data.message);

            const {
                HourToSchedule: hourToSchedule,
                DayToSchedule: dayToSchedule,
                ScheduleAnticipation: scheduleAnticipation,
                ScheduleDelay: scheduleDelay,
                ScheduleMethod: scheduleMethod,
                SchedulePreferredHours: schedulePreferredHours,
                DeadlineMinutesToSchedule: deadlineMinutesToSchedule,
                PuppeteerHeadless: puppeteerHeadless
            } = data;

            preferences = {
                hourToSchedule,
                dayToSchedule,
                scheduleAnticipation,
                scheduleDelay,
                scheduleMethod,
                schedulePreferredHours,
                deadlineMinutesToSchedule,
                puppeteerHeadless
            };

            // start clocks
            dateToSchedule = getDateToSchedule(getEasternTime(), dayToSchedule, hourToSchedule, deadlineMinutesToSchedule);

            updateTime();
            updateTimeLeft();
            setInterval(() => {
                updateTime();
                updateTimeLeft();
            }, 1000);

            // set header
            updateHeader();
        })
        .catch(err => {
            console.error(err);
            updateTime();
            setInterval(updateTime, 1000);
        });

    // set eastern gmt
    document.querySelector('.time-eastern .section-time__item__timezone').textContent.replace('-5', getEasternGMT());

    // change week event
    document.querySelector('.section-calendar__header').addEventListener('click', (e) => {
        if (e.target.classList.contains('section-calendar__header__arrow')) {
            if (e.target.classList.contains('arrow-left')) {
                if (week > 0) week--;
            } else {
                week++;
            }
            updateHeader();
            if (!preferences.schedulePreferredHours) { // fetch hours for week if not using preferred hours
                fetchCalendar();
            }
        }
    });

    // discard changes event
    document.querySelector('.section-schedule').addEventListener('click', async (e) => {
        if (e.target.classList.contains('section-schedule__cancel')) {
            updateCalendar();
        } else {
            const save = async () => {
                const $cells = document.querySelector('.section-calendar table tbody').querySelectorAll('.cell');

                const newWeekMatrix = getWeekMatrix();
                for (let i = 0; i < $cells.length; i++) {
                    const id = +$cells[i].id.split('cell')[1];
                    const day = id % 7;
                    const hour = Math.floor(id / 7);

                    if ($cells[i].classList.contains('selected')) {
                        newWeekMatrix[day][hour] = 1;
                    }
                }

                let endpoint, body;
                if (preferences.schedulePreferredHours) {
                    endpoint = '/api/preferredHours';
                    body = { hours: newWeekMatrix };
                } else {
                    endpoint = '/api/hours';
                    body = { week, hours: newWeekMatrix };
                }

                try {
                    const { status, data } = await fetch(endpoint, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body
                    });
                    if (status !== 201) throw new Error(data.message);
                    weekMatrix = newWeekMatrix;
                } catch (error) {
                    console.error(error);
                    return false;
                }
                return true;
            }
            if (e.target.classList.contains('section-schedule__save')) {
                const result = await save();
                alert(result ? 'Cambios guardados' : 'Error al guardar los cambios');

            } else if (e.target.classList.contains('section-schedule__schedule')) {
                const $buttons = document.querySelectorAll('.section-schedule button');
                $buttons.forEach($button => $button.disabled = true);

                const result = await save();
                if (!result) return alert('Error al guardar los cambios');
                try {
                    const { status, data } = await fetch('/api/week', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: { week },
                        timeout: 60000 // 1 minute
                    });
                    if (status !== 200) throw new Error(data.message);
                    alert('Horario agendado.\nPor favor revisar resultado en la web.\n\n' + data.message);
                } catch (error) {
                    console.error(error);
                    alert('Error al programar el horario\n\n' + error.message);
                }
                $buttons.forEach($button => $button.disabled = false);
            }
        }
    });
});

window.addEventListener('DOMContentLoaded', fetchCalendar);

function timeFormat(date) {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    return `${hours < 10 ? '0' + hours : hours}:${minutes < 10 ? '0' + minutes : minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
}

function updateCalendar() {
    for (let i = 0; i < weekMatrix.length; i++) {
        for (let j = 0; j < weekMatrix[i].length; j++) {

            const cell = document.getElementById(`cell${i + 7 * j}`);
            if (!cell) {

            } else {
                if (weekMatrix[i][j]) {
                    if (!cell.classList.contains('selected')) cell.classList.add('selected');
                } else {
                    if (cell.classList.contains('selected')) cell.classList.remove('selected');
                }
            }
        }
    }
}

function updateTime() {
    $timeLocal.textContent = timeFormat(new Date());
    $timeEastern.textContent = timeFormat(getEasternTime());
}

function updateTimeLeft() {
    const timeLeft = dateToSchedule - new Date() - preferences.scheduleAnticipation;
    if (timeLeft <= 0) {
        $timeLeft.textContent = '0d 0h 0m 0s';
        setTimeout(() => {
            dateToSchedule = new Date(dateToSchedule.getTime() + 604800000);
        }, 3600000 + 1);
    } else {
        // const date = new Date(timeLeft);
        // $timeLeft.textContent = `${date.getDate() - 1}d ${date.getHours()}h ${date.getMinutes()}m ${date.getSeconds()}s`;
        const days = timeLeft / 86400000;
        const hours = days % 1 * 24;
        const minutes = hours % 1 * 60;
        const seconds = minutes % 1 * 60;
        $timeLeft.textContent = `${Math.floor(days)}d ${Math.floor(hours)}h ${Math.floor(minutes)}m ${Math.floor(seconds)}s`;
    }
}

function updateHeader() {
    const [sunday, saturday] = getWeekBounds(week);
    document.querySelector('.section-calendar__header__title').textContent = `Semana del ${sunday.getDate()} al ${saturday.getDate()} (${preferences.schedulePreferredHours ? 'Horas preferidas' : 'Horario por semana'})`;
}

async function fetchCalendar() {
    try {
        const { status, data } = await fetch('/api/week/' + week);
        if (status !== 200) throw new Error(data.message);
        // data[6][23] = 1; // test
        // console.log(data);
        weekMatrix = data;
        updateCalendar();
    } catch (err) {
        console.error(err);
    }
}

const $timeLocal = document.querySelector('.time-local .section-time__item__time');
const $timeEastern = document.querySelector('.time-eastern .section-time__item__time');
const $timeLeft = document.querySelector('.time-left .section-time__item__time');

let week = 0;
let weekMatrix;
let dateToSchedule;
let preferences;
