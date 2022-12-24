import { Router } from 'express';
import { get } from '../controllers/user.controllers.js';
import verifyToken from '../helpers/jwt.js';

const router = Router();

router.get('/', verifyToken, get);

export default router;
