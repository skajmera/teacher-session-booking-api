import { z } from 'zod';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const createSessionSchema = z.object({
  body: z
    .object({
      teacherId: z.string().regex(objectIdRegex, 'Invalid teacher ID format'),
      startTime: z.string().datetime({ message: 'startTime must be a valid ISO datetime string' }),
      endTime: z.string().datetime({ message: 'endTime must be a valid ISO datetime string' })
    })
    .refine((data) => new Date(data.endTime).getTime() > new Date(data.startTime).getTime(), {
      message: 'endTime must be greater than startTime',
      path: ['endTime']
    })
});

export const bookSessionSchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdRegex, 'Invalid session ID format')
  }),
  body: z.object({
    userId: z.string().regex(objectIdRegex, 'Invalid user ID format')
  })
});

export const completeSessionSchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdRegex, 'Invalid session ID format')
  })
});

export const availableSessionsQuerySchema = z.object({
  query: z.object({
    dateTimestamp: z
      .string()
      .min(1, 'dateTimestamp query parameter is required')
      .refine(
        (val) => {
          const numeric = Number(val);
          if (!isNaN(numeric) && numeric > 0) return true;
          const parsedDate = new Date(val);
          return !isNaN(parsedDate.getTime());
        },
        {
          message: 'dateTimestamp must be a valid numeric unix timestamp or ISO date string'
        }
      )
  })
});
