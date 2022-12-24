import { Router } from 'express';
import { add, remove, removeByID } from '../controllers/hour.controllers.js';
import verifyToken from '../helpers/jwt.js';

const router = Router();

router.post('/', verifyToken, add);
router.delete('/', verifyToken, remove);
router.delete('/:id', verifyToken, removeByID);

export default router;
