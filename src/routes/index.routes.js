import { Router } from 'express';
import { hello, login } from '../controllers/index.controllers.js';

const router = Router();

/* GET home page. */

// router.get('/protegida', verifyToken, function (req, res, next) {
// 	console.log(req.user)
// 	res.send('acceso atorizado')
// });

// router.get('/generatetoken', (req, res) => {
// 	const id = 'leonardo'
// 	jwt.sign({ id }, JWT_SECRET, (err, token) => {
// 		if (err) {
// 			res.status(400).send({ msg: 'Error' })
// 		}
// 		else {
// 			res.send({ msg: 'success', token: token })
// 		}
// 	})
// });

router.get('/', hello);
router.post('/login', login);

export default router;
