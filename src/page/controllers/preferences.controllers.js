export default function (req, res) {
    res.status(200).render('preferences', { _title: 'Preferences | Tutor Manager', user: req.user });
}
