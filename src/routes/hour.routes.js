import { Router } from 'express';
import { add, remove } from '../controllers/hour.controllers.js';

const router = Router();

router.post('/', add);
router.delete('/:id', remove);

export default router;
