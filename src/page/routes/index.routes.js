import { Router } from 'express';
import login from './login.routes.js';
import preferences from './preferences.routes.js';
import schedule from './schedule.routes.js';
import loggedIn from '../../middlewares/loggedIn.js';

const router = Router();

router.get('/', loggedIn, (req, res) => res.status(200).render('index', { _title: 'Home | Tutor Manager', user: req.user }));

router.use('/login', login);
router.use('/preferences', loggedIn, preferences);
router.use('/schedule', loggedIn, schedule);

router.use((_, res) => res.status(404).render('404', { _title: '404 | Tutor Manager' }));

export default router;
