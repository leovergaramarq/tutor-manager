import { LOCAL_TIMEZONE } from "../../config.js";
import { getLocalTime } from "../../helpers/week.js";

export default function (req, res) {
    const localTimezone = LOCAL_TIMEZONE.split("/").reverse().join(", ").replace("_", " ");
    const localDate = getLocalTime();
    const localGmt = getGMT(localDate);

    const easternTimezone = "New_York, America";
    const easternDate = new Date();
    const easternGmt = getGMT(easternDate);

    res.status(200).render("home", {
        _title: "Home | Tutor Manager",
        _localTimezone: `${localTimezone} GMT${localGmt}`,
        _easternTimezone: `${easternTimezone} GMT${easternGmt}`,
        _styles: ["/css/home.css"],
        user: req.user
    });
}

function getGMT(date) {
    const gmtOffsetSymbol = date.getTimezoneOffset() > 0 ? "-" : "+"
    const gmtOffset = Math.abs(date.getTimezoneOffset() / 60).toString().padStart(2, "0");
    
    return `${gmtOffsetSymbol}${gmtOffset}`;
}
