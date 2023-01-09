import { Router } from 'express';
import schedule from '../controllers/schedule.controllers.js';

const router = Router();

router.get('/', schedule);

export default router;
