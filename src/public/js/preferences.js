import fetch from "./fetch.js";

window.addEventListener("load", function () {
    fetchPreferences().then(() => {});
});

document
    .querySelector(".form-area-buttons")
    .addEventListener("click", async function (e) {
        const { id } = e.target;
        if (id !== "save" && id !== "reset") return;

        e.preventDefault();
        if (id === "save") {
            const body = {
                hourToSchedule: document
                    .getElementById("hourToSchedule")
                    .value.split(":")[0],
                dayToSchedule: document.getElementById("dayToSchedule").value,
                scheduleAnticipation:
                    +document.getElementById("scheduleAnticipation").value *
                    1000,
                scheduleDelay: document.getElementById("scheduleDelay").value,
                scheduleMethod: document.getElementById("scheduleMethod").value,
                deadlineMinutesToSchedule: document.getElementById(
                    "deadlineMinutesToSchedule"
                ).value,
                schedulePreferredHours: document.getElementById(
                    "schedulePreferredHours"
                ).checked
                    ? 1
                    : 0,
                puppeteerHeadless: document.getElementById("puppeteerHeadless")
                    .checked
                    ? 1
                    : 0
            };
            console.log(body);
            try {
                const { status, data } = await fetch("/api/preferences", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body
                });
                if (status !== 200) throw new Error(data.message);
            } catch (err) {
                console.error(err);
                return alert("Error saving preferences");
            }
            // fetchPreferences();
            alert("Preferences saved");
        } else if (id === "reset") {
            try {
                const { status, data } = await fetch("/api/preferences", {
                    method: "DELETE"
                });
                if (status !== 200) throw new Error(data.message);
            } catch (err) {
                console.error(err);
                return alert("Error resetting preferences");
            }
            fetchPreferences();
            alert("Preferences reset");
        }
    });

async function fetchPreferences() {
    let data;
    try {
        const res = await fetch("/api/preferences");
        if (res.status !== 200) throw new Error(data.message);
        data = res.data;
    } catch (err) {
        return console.error(err);
    }
    preferences = {
        hourToSchedule: data.HourToSchedule,
        dayToSchedule: data.DayToSchedule,
        scheduleAnticipation: data.ScheduleAnticipation,
        scheduleDelay: data.ScheduleDelay,
        scheduleMethod: data.ScheduleMethod,
        schedulePreferredHours: data.SchedulePreferredHours,
        deadlineMinutesToSchedule: data.DeadlineMinutesToSchedule,
        puppeteerHeadless: data.PuppeteerHeadless
    };
    document.getElementById("dayToSchedule").value = preferences.dayToSchedule;
    const hourToSchedule = String(preferences.hourToSchedule);
    document.getElementById("hourToSchedule").value = `${
        hourToSchedule.length === 1 ? "0" : ""
    }${hourToSchedule}:00`;
    document.getElementById("scheduleAnticipation").value =
        +preferences.scheduleAnticipation / 1000;
    document.getElementById("scheduleDelay").value = preferences.scheduleDelay;
    document.getElementById("scheduleMethod").value =
        preferences.scheduleMethod;
    document.getElementById("deadlineMinutesToSchedule").value =
        preferences.deadlineMinutesToSchedule;
    document.getElementById("puppeteerHeadless").checked =
        preferences.puppeteerHeadless;
    document.getElementById("schedulePreferredHours").checked =
        preferences.schedulePreferredHours;
}

let preferences;
