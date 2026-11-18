import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { validate } from '../middlewares/validate.middleware';
import { createUserSchema, userIdParamSchema } from '../validators/user.validator';

const router = Router();

router.post('/', validate(createUserSchema), UserController.createUser);
router.get('/:id/sessions', validate(userIdParamSchema), UserController.getUserSessions);
router.get('/:id', validate(userIdParamSchema), UserController.getUserById);

export default router;
