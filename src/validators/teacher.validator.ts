import { z } from 'zod';

export const createTeacherSchema = z.object({
  body: z.object({
    fullName: z.string().trim().min(2, 'Full name must be at least 2 characters').max(100),
    email: z.string().trim().email('Invalid email address').toLowerCase(),
    specialization: z.string().trim().min(2, 'Specialization must be at least 2 characters'),
    experience: z.number().min(0, 'Experience must be a positive number')
  })
});

export const teacherIdParamSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid teacher ID format')
  })
});
