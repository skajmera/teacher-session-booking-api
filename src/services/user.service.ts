import { Types } from 'mongoose';
import { User } from '../models/user.model';
import { Session } from '../models/session.model';
import { ApiError } from '../utils/apiError';
import { IUser, UserDocument } from '../types';
import { SESSION_STATUS } from '../constants/session.constant';

export class UserService {
  public static async createUser(userData: IUser): Promise<UserDocument> {
    const existingUser = await User.findOne({ email: userData.email.toLowerCase() });
    if (existingUser) {
      throw ApiError.conflict('User with this email already exists');
    }

    const user = await User.create({
      fullName: userData.fullName,
      email: userData.email.toLowerCase(),
      phone: userData.phone
    });

    return user;
  }

  public static async getUserById(userId: string): Promise<UserDocument> {
    const user = await User.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }
    return user;
  }

  public static async getUserSessions(userId: string) {
    const user = await User.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    const userObjectId = new Types.ObjectId(userId);

    const [result] = await Session.aggregate([
      {
        $match: {
          userId: userObjectId
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
        $unwind: {
          path: '$teacher',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          _id: 1,
          userId: 1,
          teacherId: 1,
          teacher: {
            _id: '$teacher._id',
            fullName: '$teacher.fullName',
            email: '$teacher.email',
            specialization: '$teacher.specialization'
          },
          startTime: 1,
          endTime: 1,
          status: 1,
          completedAt: 1,
          createdAt: 1,
          updatedAt: 1
        }
      },
      {
        $facet: {
          upcomingSessions: [
            {
              $match: {
                status: SESSION_STATUS.BOOKED
              }
            },
            {
              $sort: {
                startTime: 1
              }
            }
          ],
          completedSessions: [
            {
              $match: {
                status: SESSION_STATUS.COMPLETED
              }
            },
            {
              $sort: {
                completedAt: -1,
                startTime: -1
              }
            }
          ]
        }
      }
    ]);

    return {
      upcomingSessions: result?.upcomingSessions ?? [],
      completedSessions: result?.completedSessions ?? []
    };
  }
}
