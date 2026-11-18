import { Document, Types } from 'mongoose';

export type SessionStatus = 'AVAILABLE' | 'BOOKED' | 'COMPLETED';

export interface IUser {
  fullName: string;
  email: string;
  phone: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type UserDocument = IUser & Document<Types.ObjectId>;

export interface ITeacher {
  fullName: string;
  email: string;
  specialization: string;
  experience: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export type TeacherDocument = ITeacher & Document<Types.ObjectId>;

export interface ISession {
  teacherId: Types.ObjectId;
  userId?: Types.ObjectId | null;
  startTime: Date;
  endTime: Date;
  status: SessionStatus;
  completedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type SessionDocument = ISession & Document<Types.ObjectId>;
