import { Router } from 'express';
import { get, upsert, reset } from '../controllers/preference.controllers.js';
import verifyToken from '../helpers/jwt.js';

const router = Router();

router.get('/', verifyToken, get)
router.put('/', verifyToken, upsert);
router.delete('/', verifyToken, reset);

export default router;
