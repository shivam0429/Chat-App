import { Router } from 'express';
import {
  getMessages,
  postMessage,
  clearMessages,
  getDirectMessages,
  clearDirectMessages,
} from '../controllers/messageController.js';
import { validateMessage, handleValidation } from '../middleware/validators.js';
import { protect } from '../middleware/auth.js';

const router = Router();

// Public room
router.get('/', protect, getMessages);
router.post('/', protect, validateMessage, handleValidation, postMessage);
router.delete('/', protect, clearMessages);

// Private direct messages with a specific user
router.get('/dm/:userId', protect, getDirectMessages);
router.delete('/dm/:userId', protect, clearDirectMessages);

export default router;
