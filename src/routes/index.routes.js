import { Router } from 'express';
import { hello, login } from '../controllers/index.controllers.js';

const router = Router();

router.get('/', hello);
router.post('/login', login);

export default router;
