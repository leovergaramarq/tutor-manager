import { Router } from 'express';
import user from './user.routes.js';
import hour from './hour.routes.js';
import week from './week.routes.js';
import preference from './preference.routes.js';
import preferredHour from './preferredHour.routes.js';
import { hello, login, logout, billing, rating, usd } from '../controllers/index.controllers.js';

const router = Router();

router.get('/', hello);
router.post('/login', login);
router.post('/logout', logout);
router.get('/billing', billing);
router.get('/rating', rating);
router.get('/usd', usd);

router.use('/user', user);
router.use('/hours', hour);
router.use('/week', week);
router.use('/preferences', preference);
router.use('/preferredHours', preferredHour);


router.use((_, res) => {
	res.status(404).json({ message: 'Not found' });
});

export default router;
