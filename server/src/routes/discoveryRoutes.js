
import { Router } from 'express';
import { discoverStartups } from '../controllers/discoveryController.js';

const router = Router();

router.get('/', discoverStartups);

export default router;
