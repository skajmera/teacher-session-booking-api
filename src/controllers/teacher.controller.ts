import { Request, Response } from 'express';
import { TeacherService } from '../services/teacher.service';
import { ApiResponse } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';

export class TeacherController {
  public static createTeacher = asyncHandler(async (req: Request, res: Response) => {
    const teacher = await TeacherService.createTeacher(req.body);
    res.status(201).json(new ApiResponse(201, teacher, 'Teacher created successfully'));
  });

  public static getTeacherById = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const teacher = await TeacherService.getTeacherById(id);
    res.status(200).json(new ApiResponse(200, teacher));
  });

  public static getAllTeachers = asyncHandler(async (_req: Request, res: Response) => {
    const teachers = await TeacherService.getAllTeachers();
    res.status(200).json(new ApiResponse(200, teachers));
  });
}
