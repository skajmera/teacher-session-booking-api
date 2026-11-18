import mongoose from 'mongoose';
import { connectDB, disconnectDB } from './config/database';
import { User } from './models/user.model';
import { Teacher } from './models/teacher.model';
import { Session } from './models/session.model';
import { SESSION_STATUS } from './constants/session.constant';

const seed = async () => {
  try {
    await connectDB();

    console.log('Clearing existing data...');
    await Promise.all([
      User.deleteMany({}),
      Teacher.deleteMany({}),
      Session.deleteMany({})
    ]);

    console.log('Seeding teachers...');
    const teachers = await Teacher.create([
      {
        fullName: 'Dr. Sarah Connor',
        email: 'sarah.connor@example.com',
        specialization: 'Computer Science & AI',
        experience: 8
      },
      {
        fullName: 'Prof. Alan Turing',
        email: 'alan.turing@example.com',
        specialization: 'Algorithms & Mathematics',
        experience: 12
      },
      {
        fullName: 'Dr. Ada Lovelace',
        email: 'ada.lovelace@example.com',
        specialization: 'Software Architecture',
        experience: 10
      }
    ]);

    console.log('Seeding users...');
    const users = await User.create([
      {
        fullName: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+1-555-0101'
      },
      {
        fullName: 'Jane Smith',
        email: 'jane.smith@example.com',
        phone: '+1-555-0102'
      }
    ]);

    console.log('Seeding sessions...');
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const session1Start = new Date(today);
    session1Start.setUTCHours(10, 0, 0, 0);
    const session1End = new Date(today);
    session1End.setUTCHours(11, 0, 0, 0);

    const session2Start = new Date(today);
    session2Start.setUTCHours(14, 0, 0, 0);
    const session2End = new Date(today);
    session2End.setUTCHours(15, 0, 0, 0);

    const session3Start = new Date(tomorrow);
    session3Start.setUTCHours(11, 0, 0, 0);
    const session3End = new Date(tomorrow);
    session3End.setUTCHours(12, 0, 0, 0);

    const pastSessionStart = new Date(today);
    pastSessionStart.setDate(pastSessionStart.getDate() - 2);
    pastSessionStart.setUTCHours(9, 0, 0, 0);
    const pastSessionEnd = new Date(pastSessionStart);
    pastSessionEnd.setUTCHours(10, 0, 0, 0);

    await Session.create([
      {
        teacherId: teachers[0]._id,
        userId: null,
        startTime: session1Start,
        endTime: session1End,
        status: SESSION_STATUS.AVAILABLE,
        completedAt: null
      },
      {
        teacherId: teachers[1]._id,
        userId: null,
        startTime: session2Start,
        endTime: session2End,
        status: SESSION_STATUS.AVAILABLE,
        completedAt: null
      },
      {
        teacherId: teachers[0]._id,
        userId: users[0]._id,
        startTime: session3Start,
        endTime: session3End,
        status: SESSION_STATUS.BOOKED,
        completedAt: null
      },
      {
        teacherId: teachers[1]._id,
        userId: users[0]._id,
        startTime: pastSessionStart,
        endTime: pastSessionEnd,
        status: SESSION_STATUS.COMPLETED,
        completedAt: new Date(pastSessionEnd)
      }
    ]);

    console.log('Database seeded successfully:');
    console.log(`- Teachers created: ${teachers.length}`);
    console.log(`- Users created: ${users.length}`);
    console.log(`- Sample User ID: ${users[0]._id}`);
    console.log(`- Sample Teacher ID: ${teachers[0]._id}`);

    await disconnectDB();
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    await disconnectDB();
    process.exit(1);
  }
};

seed();
