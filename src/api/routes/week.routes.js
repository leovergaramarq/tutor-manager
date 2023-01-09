import { Router } from 'express';
import { get, clearWeek, schedule } from '../controllers/week.controllers.js';

const router = Router();

router.get('/', get);
router.get('/:date', get);
router.post('/', schedule);
router.delete('/', clearWeek);
router.delete('/:date', clearWeek);

export default router;
