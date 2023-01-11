export default function (req, res) {
    res.status(200).render('preferences', {
        _title: 'Preferencias | Tutor Manager',
        _styles: ['/css/preferences.css'],
        user: req.user
    });
}
