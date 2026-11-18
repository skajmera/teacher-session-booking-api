import { Router } from 'express';
import { SessionController } from '../controllers/session.controller';
import { validate } from '../middlewares/validate.middleware';
import {
  createSessionSchema,
  bookSessionSchema,
  completeSessionSchema,
  availableSessionsQuerySchema
} from '../validators/session.validator';

const router = Router();

router.post('/', validate(createSessionSchema), SessionController.createSession);
router.get('/available', validate(availableSessionsQuerySchema), SessionController.getAvailableSessions);
router.post('/:id/book', validate(bookSessionSchema), SessionController.bookSession);
router.patch('/:id/complete', validate(completeSessionSchema), SessionController.completeSession);

export default router;
