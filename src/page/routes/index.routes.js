import { Router } from 'express';
import login from './login.routes.js';
import preferences from './preferences.routes.js';
import schedule from './schedule.routes.js';
import { loggedIn, loggedOut } from '../../middlewares/session.js';

const router = Router();

router.get('/', loggedIn, (req, res) => res.status(200).render('home', { _title: 'Home | Tutor Manager', user: req.user }));

router.use('/login', loggedOut, login);
router.use('/preferences', loggedIn, preferences);
router.use('/schedule', loggedIn, schedule);

router.use((_, res) => res.status(404).render('404', { _title: '404 | Tutor Manager' }));

export default router;
