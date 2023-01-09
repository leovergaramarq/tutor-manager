import { Router } from 'express';
import login from '../controllers/login.controllers.js';

const router = Router();

router.get('/', login);

export default router;
