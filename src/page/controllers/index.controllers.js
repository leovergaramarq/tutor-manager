import { jsType } from "../../constants.js";

export default function (req, res) {
    res.status(200).render("home", {
        _title: "Home | Tutor Manager",
        _styles: ["/css/home.css"],
        user: req.user,
        jsTypeModule: jsType === "module"
    });
}
