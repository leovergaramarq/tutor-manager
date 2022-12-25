import { Router } from 'express';
import { get, schedule } from '../controllers/week.controllers.js';
import verifyToken from '../helpers/jwt.js';

const router = Router();

router.get('/:week', verifyToken, get);
router.post('/schedule', verifyToken, schedule);

export default router;
