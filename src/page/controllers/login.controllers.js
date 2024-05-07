export default function (req, res) {
    res.status(200).render("login", {
        _title: "Login | Tutor Manager",
        _styles: ["/css/login.css"]
    });
}
