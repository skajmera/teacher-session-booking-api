import { Teacher } from '../models/teacher.model';
import { ApiError } from '../utils/apiError';
import { ITeacher, TeacherDocument } from '../types';

export class TeacherService {
  public static async createTeacher(teacherData: ITeacher): Promise<TeacherDocument> {
    const existing = await Teacher.findOne({ email: teacherData.email.toLowerCase() });
    if (existing) {
      throw ApiError.conflict('Teacher with this email already exists');
    }

    const teacher = await Teacher.create({
      fullName: teacherData.fullName,
      email: teacherData.email.toLowerCase(),
      specialization: teacherData.specialization,
      experience: teacherData.experience
    });

    return teacher;
  }

  public static async getTeacherById(teacherId: string): Promise<TeacherDocument> {
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      throw ApiError.notFound('Teacher not found');
    }
    return teacher;
  }

  public static async getAllTeachers(): Promise<TeacherDocument[]> {
    return Teacher.find().sort({ createdAt: -1 });
  }
}
