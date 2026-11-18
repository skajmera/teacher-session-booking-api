import { Schema, model } from 'mongoose';
import { TeacherDocument } from '../types';

const teacherSchema = new Schema<TeacherDocument>(
  {
    fullName: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    specialization: {
      type: String,
      required: true,
      trim: true
    },
    experience: {
      type: Number,
      required: true,
      min: 0
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

export const Teacher = model<TeacherDocument>('Teacher', teacherSchema);
