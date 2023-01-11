export default function (req, res) {
    res.status(200).render('rating', {
        _title: 'Rating | Tutor Manager',
        _styles: ['/css/rating.css'],
        user: req.user
    });
}
