import fetch from './fetch.js';
import { getEasternGMT, getEasternTime, getWeekBounds, getWeekMatrix } from './utils.js';

window.addEventListener('load', () => {
    // set eastern gmt
    document.querySelector('.time-eastern .section-time__item__timezone').textContent = `Nueva York, EEUU (GMT ${getEasternGMT()})`;

    // set time
    updateTime();
    setInterval(updateTime, 1000);

    // set header
    updateHeader();

    // change week event
    document.querySelector('.section-calendar__header').addEventListener('click', (e) => {
        if (e.target.classList.contains('section-calendar__header__arrow')) {
            if (e.target.classList.contains('arrow-left')) {
                if (week > 0) week--;
            } else {
                week++;
            }
            updateHeader();
            fetchCalendar();
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
    
                try {
                    const { status, data } = await fetch('/api/hours', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: { week, hours: newWeekMatrix }
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
                        timeout: 30000
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

function updateHeader() {
    const [sunday, saturday] = getWeekBounds(week);
    document.querySelector('.section-calendar__header__title').textContent = `Semana del ${sunday.getDate()} al ${saturday.getDate()}`;
}

async function fetchCalendar() {
    try {
        const { status, data } = await fetch('/api/week/' + week);
        if (status === 200) {
            // data[6][23] = 1; // test
            console.log(data);
            weekMatrix = data;
            updateCalendar();
        }
    } catch (err) {
        console.error(err);
    }
}

const $timeLocal = document.querySelector('.time-local .section-time__item__time');
const $timeEastern = document.querySelector('.time-eastern .section-time__item__time');
let week = 0;
let weekMatrix;
