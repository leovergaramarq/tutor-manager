export default function (req, res) {
    res.status(200).render('schedule', { _title: 'Schedule | Tutor Manager', user: req.user });
}
