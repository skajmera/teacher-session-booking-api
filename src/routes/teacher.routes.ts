import { Router } from 'express';
import { TeacherController } from '../controllers/teacher.controller';
import { validate } from '../middlewares/validate.middleware';
import { createTeacherSchema, teacherIdParamSchema } from '../validators/teacher.validator';

const router = Router();

router.post('/', validate(createTeacherSchema), TeacherController.createTeacher);
router.get('/', TeacherController.getAllTeachers);
router.get('/:id', validate(teacherIdParamSchema), TeacherController.getTeacherById);

export default router;
