import { Router } from 'express';
import { add, remove, removeByID } from '../controllers/hour.controllers.js';

const router = Router();

router.post('/', add);
router.delete('/', remove);
router.delete('/:id', removeByID);

export default router;
