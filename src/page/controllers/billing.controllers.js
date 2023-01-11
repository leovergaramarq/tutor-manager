export default function (req, res) {
    res.status(200).render('billing', {
        _title: 'Información de Pago | Tutor Manager',
        _styles: ['/css/billing.css'],
        user: req.user
    });
}
