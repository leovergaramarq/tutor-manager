import { Router } from 'express';
import preferences from '../controllers/preferences.controllers.js';

const router = Router();

router.get('/', preferences);

export default router;
