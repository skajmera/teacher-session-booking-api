import { Types } from 'mongoose';
import { Session } from '../models/session.model';
import { Teacher } from '../models/teacher.model';
import { User } from '../models/user.model';
import { ApiError } from '../utils/apiError';
import { SessionDocument } from '../types';
import { SESSION_STATUS } from '../constants/session.constant';

interface CreateSessionDTO {
  teacherId: string;
  startTime: string | Date;
  endTime: string | Date;
}

export class SessionService {
  public static async createSession(data: CreateSessionDTO): Promise<SessionDocument> {
    const teacher = await Teacher.findById(data.teacherId);
    if (!teacher) {
      throw ApiError.notFound('Teacher not found');
    }

    const start = new Date(data.startTime);
    const end = new Date(data.endTime);

    if (end.getTime() <= start.getTime()) {
      throw ApiError.badRequest('endTime must be greater than startTime');
    }

    const overlappingSession = await Session.findOne({
      teacherId: new Types.ObjectId(data.teacherId),
      $or: [
        { startTime: { $lt: end }, endTime: { $gt: start } }
      ]
    });

    if (overlappingSession) {
      throw ApiError.conflict('Teacher already has a session scheduled during this time slot');
    }

    const session = await Session.create({
      teacherId: new Types.ObjectId(data.teacherId),
      startTime: start,
      endTime: end,
      status: SESSION_STATUS.AVAILABLE,
      userId: null,
      completedAt: null
    });

    return session;
  }

  public static async getAvailableSessions(dateTimestamp: string) {
    const numeric = Number(dateTimestamp);
    const parsedDate = !isNaN(numeric)
      ? new Date(numeric < 1e11 ? numeric * 1000 : numeric)
      : new Date(dateTimestamp);

    if (isNaN(parsedDate.getTime())) {
      throw ApiError.badRequest('Invalid dateTimestamp parameter');
    }

    const startOfDay = new Date(
      Date.UTC(parsedDate.getUTCFullYear(), parsedDate.getUTCMonth(), parsedDate.getUTCDate(), 0, 0, 0, 0)
    );
    const endOfDay = new Date(
      Date.UTC(parsedDate.getUTCFullYear(), parsedDate.getUTCMonth(), parsedDate.getUTCDate(), 23, 59, 59, 999)
    );

    const sessions = await Session.aggregate([
      {
        $match: {
          status: SESSION_STATUS.AVAILABLE,
          startTime: {
            $gte: startOfDay,
            $lte: endOfDay
          }
        }
      },
      {
        $lookup: {
          from: 'teachers',
          localField: 'teacherId',
          foreignField: '_id',
          as: 'teacher'
        }
      },
      {
        $unwind: '$teacher'
      },
      {
        $project: {
          _id: 1,
          teacherId: 1,
          teacher: {
            _id: '$teacher._id',
            fullName: '$teacher.fullName',
            email: '$teacher.email',
            specialization: '$teacher.specialization',
            experience: '$teacher.experience'
          },
          userId: 1,
          startTime: 1,
          endTime: 1,
          status: 1,
          completedAt: 1,
          createdAt: 1,
          updatedAt: 1
        }
      },
      {
        $sort: {
          startTime: 1
        }
      }
    ]);

    return sessions;
  }

  public static async bookSession(sessionId: string, userId: string): Promise<SessionDocument> {
    const user = await User.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    const existingSession = await Session.findById(sessionId);
    if (!existingSession) {
      throw ApiError.notFound('Session not found');
    }

    if (existingSession.status !== SESSION_STATUS.AVAILABLE) {
      throw ApiError.badRequest(`Session cannot be booked because it is ${existingSession.status.toLowerCase()}`);
    }

    const updatedSession = await Session.findOneAndUpdate(
      {
        _id: new Types.ObjectId(sessionId),
        status: SESSION_STATUS.AVAILABLE
      },
      {
        status: SESSION_STATUS.BOOKED,
        userId: new Types.ObjectId(userId)
      },
      {
        new: true
      }
    );

    if (!updatedSession) {
      throw ApiError.conflict('Session was already booked by another user');
    }

    return updatedSession;
  }

  public static async completeSession(sessionId: string): Promise<SessionDocument> {
    const session = await Session.findById(sessionId);
    if (!session) {
      throw ApiError.notFound('Session not found');
    }

    if (session.status !== SESSION_STATUS.BOOKED) {
      throw ApiError.badRequest(`Only booked sessions can be marked as completed. Current status: ${session.status}`);
    }

    session.status = SESSION_STATUS.COMPLETED;
    session.completedAt = new Date();
    await session.save();

    return session;
  }
}
