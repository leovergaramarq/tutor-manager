import { Router } from 'express';
import rating from '../controllers/rating.controllers.js';

const router = Router();

router.get('/', rating);

export default router;
