import { Router } from 'express';
import usersRouter from './user.routes.js';
import hoursRouter from './hour.routes.js';
import weeksRouter from './week.routes.js';
import preferencesRouter from './preference.routes.js';
import preferredHoursRouter from './preferredHour.routes.js';
import { hello, login } from '../controllers/index.controllers.js';

const router = Router();

router.get('/', hello);
router.post('/login', login);

router.use('/user', usersRouter);
router.use('/hours', hoursRouter);
router.use('/week', weeksRouter);
router.use('/preferences', preferencesRouter);
router.use('/preferredHours', preferredHoursRouter);

export default router;
