import fetch from './fetch.js';
import { showLoading, hideLoading } from './utils.js';

window.addEventListener('load', async function () {
    initSelectors();

    showLoading();
    Promise.all([fetchData(), fetchUSD()]).then(hideLoading).catch(err => console.error(err));

    document.querySelector('.section-payment').addEventListener('input', recalculatePayment);
    document.querySelector('.section-time').addEventListener('input', e => {
        recalculateTime();
        if (e.target.id = 'onlineHours') recalculatePayment(); // recalculate payment if online hours change (bonus might change)
    });
    
    document.querySelector('.section-buttons').addEventListener('click', e => {
        const { id } = e.target;
        if (id === 'reset') {
            // console.log(data);
            // console.log(usd);
            if (data) {
                const { minutesWaiting, minutesInSession, scheduledHours, onlineHours } = data;
                $minutesWaiting.value = minutesWaiting;
                $minutesInSession.value = minutesInSession;
                $scheduledHours.value = scheduledHours;
                $onlineHours.value = onlineHours;
            }
            if(usd) $usd.value = usd;
            
            recalculatePayment();
            recalculateTime();
        } else if (id === 'refresh') {
            fetchData();
            fetchUSD();
        }
    });
});

async function fetchData() {
    try {
        const { status, data: json } = await fetch('/api/billing');
        if (status !== 200) throw new Error(json.message);
        console.log(json);
        data = json;
    } catch (err) {
        console.log(err);
        return alert('Error fetching data');
    }
    // data = {
    //     scheduledHours: Math.floor(Math.random() * 100),
    //     onlineHours: Math.floor(Math.random() * 100),
    //     minutesWaiting: Math.floor(Math.random() * 1000),
    //     minutesInSession: Math.floor(Math.random() * 1000),
    // };

    const { scheduledHours, onlineHours, minutesWaiting, minutesInSession } = data;

    $minutesInSession.value = minutesInSession;
    $minutesWaiting.value = minutesWaiting;
    $scheduledHours.value = scheduledHours;
    $onlineHours.value = onlineHours;

    if (usd !== undefined) recalculatePayment();
    recalculateTime();
}

async function fetchUSD() {
    try {
        const { status, data } = await fetch('/api/usd');
        if (status !== 200) throw new Error(data.message);
        console.log(data);
        usd = +data.usd.toFixed(1);
    } catch (err) {
        console.log(err);
        return alert('Error fetching USD');
    }
    
    // usd = 4700;

    $usd.value = usd;
    if (data !== undefined) recalculatePayment();
}

function recalculatePayment() {
    let res = +((2.5 * +$minutesWaiting.value + +$usdPerHour.value * +$minutesInSession.value) / 60).toFixed(1);
    $paymentResult1.forEach((el) => (el.value = res));

    const bonus = getBonus();
    $bonus.value = bonus;
    res += getBonus();
    $paymentResult2.forEach(el => (el.value = res));

    $paymentResult3.value = Math.floor(res * +$usd.value);
}

function recalculateTime() {
    $timeResult.value = ((+$onlineHours.value / +$scheduledHours.value) * 100).toFixed(1);
}

function initSelectors() {
    $minutesWaiting = document.getElementById('minutesWaiting');
    $minutesInSession = document.getElementById('minutesInSession');
    $scheduledHours = document.getElementById('scheduledHours');
    $onlineHours = document.getElementById('onlineHours');
    
    $paymentResult1 = document.querySelectorAll('.payment-result1');
    $paymentResult2 = document.querySelectorAll('.payment-result2');
    $paymentResult3 = document.querySelector('.payment-result3');
    $usd = document.getElementById('usd');
    $usdPerHour = document.getElementById('usdPerHour');
    $bonus = document.getElementById('bonus');

    $timeResult = document.querySelector('.time-result');
}

function getBonus() {
    if (data.onlineHours < 30) return 0;
    if (data.onlineHours < 60) return 40;
    if (data.onlineHours < 90) return 70;
    if (data.onlineHours < 120) return 100;
    return 140;
}

let $minutesWaiting;
let $minutesInSession;
let $scheduledHours;
let $onlineHours;
let $paymentResult1;
let $paymentResult2;
let $paymentResult3;
let $usd;
let $usdPerHour;
let $bonus;
let $timeResult;

let data;
let usd;
