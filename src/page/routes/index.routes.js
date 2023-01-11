import { Router } from 'express';
import login from './login.routes.js';
import preferences from './preferences.routes.js';
import rating from './rating.routes.js';
import billing from './billing.routes.js';
import home from '../controllers/index.controllers.js';
import { loggedIn, loggedOut } from '../../middlewares/session.js';

const router = Router();

router.get('/', loggedIn, home);

router.use('/login', loggedOut, login);
router.use('/preferences', loggedIn, preferences);
router.use('/rating', loggedIn, rating);
router.use('/billing', loggedIn, billing);

router.use((_, res) => res.status(404).render('404', { _title: '404 | Tutor Manager' }));

export default router;
