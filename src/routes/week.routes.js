import { Router } from 'express';
import { get } from '../controllers/week.controllers.js';
import verifyToken from '../helpers/jwt.js';

const router = Router();

router.get('/:week', verifyToken, get);

export default router;
