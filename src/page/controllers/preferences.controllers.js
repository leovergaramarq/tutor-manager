import { jsType } from "../../constants.js";

export default function (req, res) {
    res.status(200).render("preferences", {
        _title: "Preferences | Tutor Manager",
        _styles: ["/css/preferences.css"],
        user: req.user,
        jsTypeModule: jsType === "module"
    });
}
