
import { Router } from 'express';
import { protect, requireRole } from '../middleware/authMiddleware.js';
import {
  createStartup,
  getMyStartups,
  getStartupById,
  updateStartup,
  deleteStartup,
} from '../controllers/startupController.js';

const router = Router();

router.get('/mine', protect, requireRole('founder'), getMyStartups);
router.post('/', protect, requireRole('founder'), createStartup);
router.get('/:id', getStartupById);
router.patch('/:id', protect, requireRole('founder'), updateStartup);
router.delete('/:id', protect, requireRole('founder'), deleteStartup);

export default router;
