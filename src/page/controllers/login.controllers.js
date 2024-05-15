import { jsType } from "../../constants.js";

export default function (_, res) {
    res.status(200).render("login", {
        _title: "Login | Tutor Manager",
        _styles: ["/css/login.css"],
        jsTypeModule: jsType === "module"
    });
}
