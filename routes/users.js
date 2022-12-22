import { Router } from 'express';

const router = Router();

/* GET users listing. */
router.get('/', function (req, res, next) {
	res.status(200).json('respond with a resource');
});

export default router;
