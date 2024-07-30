import fetch from "./fetch.js";
import { showLoading, hideLoading } from "./utils.js";

window.addEventListener("load", async function () {
    initSelectors();

    $minutesWaiting.forEach(($elem) =>
        $elem.addEventListener("input", (e) => {
            $minutesWaiting[($minutesWaiting.indexOf(e.target) + 1) % 2].value =
                e.target.value;
        })
    );

    $minutesInSession.forEach(($elem) =>
        $elem.addEventListener("input", (e) => {
            $minutesInSession[
                ($minutesInSession.indexOf(e.target) + 1) % 2
            ].value = e.target.value;
        })
    );

    loadData();

    document
        .querySelector(".section-payment")
        .addEventListener("input", recalculateAll);
    document
        .querySelector(".section-online-time")
        .addEventListener("input", recalculateAll);
    document
        .querySelector(".section-time-worked")
        .addEventListener("input", recalculateAll);

    document
        .querySelector(".section-buttons")
        .addEventListener("click", (e) => {
            const { id } = e.target;
            if (id === "reset") {
                if (billingData) {
                    const {
                        minutesWaiting,
                        minutesInSession,
                        scheduledHours,
                        onlineHours
                    } = billingData;

                    $minutesWaiting.forEach(
                        ($elem) => ($elem.value = minutesWaiting)
                    );
                    $minutesInSession.forEach(
                        ($elem) => ($elem.value = minutesInSession)
                    );
                    $scheduledHours.value = scheduledHours;
                    $onlineHours.value = onlineHours;
                }
                if (usd) $usd.value = usd;

                recalculateAll();
            } else if (id === "refresh") {
                loadData();
            }
        });
});

async function fetchBillingData() {
    try {
        const { status, data: json } = await fetch("/api/billing");
        if (status !== 200) throw new Error(json.message);
        console.log(json);
        billingData = json;
    } catch (err) {
        console.error(err);
        return alert("Error fetching billing data");
    }

    // debug values
    // billingData = {
    //     scheduledHours: 56,
    //     onlineHours: 41.16,
    //     minutesWaiting: 1420,
    //     minutesInSession: 1284
    // };

    const { scheduledHours, onlineHours, minutesWaiting, minutesInSession } =
        billingData;

    $minutesInSession.forEach(($elem) => ($elem.value = minutesInSession));
    $minutesWaiting.forEach(($elem) => ($elem.value = minutesWaiting));
    $scheduledHours.value = scheduledHours;
    $onlineHours.value = onlineHours;

    recalculateAll();
}

async function fetchUSD() {
    try {
        const { status, data } = await fetch("/api/usd");
        if (status !== 200) throw new Error(data.message);
        console.log(data);
        usd = +data.usd.toFixed(1);
    } catch (err) {
        console.error(err);
        return alert("Error fetching USD data");
    }

    // debug value
    // usd = 4000;
    $usd.value = usd;
    recalculatePayment();
}

async function fetchSeason() {
    try {
        const { status, data } = await fetch("/api/preferences");
        if (status !== 200) throw new Error(data.message);
        lowSeason = data.LowSeason;
    } catch (err) {
        return console.error(err);
    }
}

function recalculateAll() {
    recalculatePayment();
    recalculateOnlineTime();
    recalculateTimeWorked();
}

function recalculatePayment() {
    let result = +(
        (2.5 * +$minutesWaiting[0].value +
            +$usdPerHour.value * +$minutesInSession[0].value) /
        60
    ).toFixed(1);
    $paymentResult1.forEach((el) => (el.value = result));

    const bonus = getBonus();
    $bonus.value = bonus;
    result += bonus;
    $paymentResult2.forEach((el) => (el.value = result));

    $paymentResult3.value = Math.floor(result * +$usd.value);
}

function recalculateOnlineTime() {
    $onlineTimeResult.value = (
        (+$onlineHours.value / +$scheduledHours.value) *
        100
    ).toFixed(1);
}

function recalculateTimeWorked() {
    let result = +$minutesWaiting[1].value + +$minutesInSession[1].value;
    $timeWorkedResult1.forEach(($elem) => {
        $elem.value = result.toFixed(1);
    });

    result /= 60;
    $timeWorkedResult2.value = result.toFixed(1);
}

function initSelectors() {
    $minutesWaiting = Array.from(document.querySelectorAll(".minutes-waiting"));
    $minutesInSession = Array.from(
        document.querySelectorAll(".minutes-in-session")
    );
    $scheduledHours = document.getElementById("scheduledHours");
    $onlineHours = document.getElementById("onlineHours");

    $paymentResult1 = Array.from(document.querySelectorAll(".payment-result1"));
    $paymentResult2 = Array.from(document.querySelectorAll(".payment-result2"));
    $paymentResult3 = document.querySelector(".payment-result3");
    $usd = document.getElementById("usd");
    $usdPerHour = document.getElementById("usdPerHour");
    $bonus = document.getElementById("bonus");

    $onlineTimeResult = document.querySelector(".online-time-result");
    $timeWorkedResult1 = Array.from(
        document.querySelectorAll(".time-worked-result1")
    );
    $timeWorkedResult2 = document.querySelector(".time-worked-result2");
}

function getBonus() {
    const hours =
        (+$minutesInSession[0].value + +$minutesWaiting[0].value) / 60;

    if (lowSeason === 0) {
        if (hours < 30) return 0;
        if (hours < 60) return 40;
        if (hours < 90) return 70;
        if (hours < 120) return 100;

        return 140;
    } else {
        if (hours < 25) return 0;
        if (hours < 50) return 40;
        if (hours < 75) return 70;
        if (hours < 100) return 100;

        return 140;
    }
}

function loadData() {
    showLoading({
        belowNavbar: true
    });
    Promise.all([fetchBillingData(), fetchUSD(), fetchSeason()])
        .catch(console.error)
        .finally(hideLoading);
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
let $onlineTimeResult;
let $timeWorkedResult1;
let $timeWorkedResult2;

let billingData;
let usd;
let lowSeason;
