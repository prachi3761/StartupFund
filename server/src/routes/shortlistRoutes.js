
import { Router } from 'express';
import { protect, requireRole } from '../middleware/authMiddleware.js';
import {
  getShortlist,
  addToShortlist,
  removeFromShortlist,
} from '../controllers/shortlistController.js';

const router = Router();

router.use(protect, requireRole('investor'));

router.get('/', getShortlist);
router.post('/:startupId', addToShortlist);
router.delete('/:startupId', removeFromShortlist);

export default router;
