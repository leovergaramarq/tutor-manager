import { jsType } from "../../constants.js";

export default function (req, res) {
    res.status(200).render("billing", {
        _title: "Billing Info | Tutor Manager",
        _styles: ["/css/billing.css"],
        user: req.user,
        jsTypeModule: jsType === "module"
    });
}
