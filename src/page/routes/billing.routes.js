import { Router } from 'express';
import billing from '../controllers/billing.controllers.js';

const router = Router();

router.get('/', billing);

export default router;
