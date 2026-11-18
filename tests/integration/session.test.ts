import request from 'supertest';
import { createApp } from '../../src/app';
import { Teacher } from '../../src/models/teacher.model';
import { User } from '../../src/models/user.model';
import { Session } from '../../src/models/session.model';
import { SESSION_STATUS } from '../../src/constants/session.constant';

const app = createApp();

describe('Session Endpoints', () => {
  let teacherId: string;
  let userId: string;

  beforeEach(async () => {
    const teacher = await Teacher.create({
      fullName: 'Dr. John Watson',
      email: 'john.watson@example.com',
      specialization: 'Mathematics',
      experience: 10
    });
    teacherId = teacher._id.toString();

    const user = await User.create({
      fullName: 'Sherlock Holmes',
      email: 'sherlock@example.com',
      phone: '+1-555-9999'
    });
    userId = user._id.toString();
  });

  describe('POST /sessions (Create Session)', () => {
    it('should create a session with status AVAILABLE', async () => {
      const startTime = new Date(Date.now() + 3600000).toISOString();
      const endTime = new Date(Date.now() + 7200000).toISOString();

      const response = await request(app)
        .post('/sessions')
        .send({
          teacherId,
          startTime,
          endTime
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe(SESSION_STATUS.AVAILABLE);
      expect(response.body.data.teacherId).toBe(teacherId);
      expect(response.body.data.userId).toBeNull();
    });

    it('should return 400 when endTime is before or equal to startTime', async () => {
      const startTime = new Date(Date.now() + 7200000).toISOString();
      const endTime = new Date(Date.now() + 3600000).toISOString();

      const response = await request(app)
        .post('/sessions')
        .send({
          teacherId,
          startTime,
          endTime
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 404 when teacher does not exist', async () => {
      const startTime = new Date(Date.now() + 3600000).toISOString();
      const endTime = new Date(Date.now() + 7200000).toISOString();

      const response = await request(app)
        .post('/sessions')
        .send({
          teacherId: '507f1f77bcf86cd799439011',
          startTime,
          endTime
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /sessions/available (Available Sessions for Booking)', () => {
    it('should return only AVAILABLE sessions for the specified date using aggregation', async () => {
      const targetDate = new Date('2026-06-15T00:00:00.000Z');
      const sessionDate = new Date('2026-06-15T10:00:00.000Z');
      const sessionEndDate = new Date('2026-06-15T11:00:00.000Z');

      const otherDate = new Date('2026-06-16T10:00:00.000Z');
      const otherEndDate = new Date('2026-06-16T11:00:00.000Z');

      await Session.create([
        {
          teacherId,
          startTime: sessionDate,
          endTime: sessionEndDate,
          status: SESSION_STATUS.AVAILABLE
        },
        {
          teacherId,
          startTime: sessionDate,
          endTime: sessionEndDate,
          status: SESSION_STATUS.BOOKED,
          userId
        },
        {
          teacherId,
          startTime: otherDate,
          endTime: otherEndDate,
          status: SESSION_STATUS.AVAILABLE
        }
      ]);

      const timestamp = targetDate.getTime();
      const response = await request(app).get(`/sessions/available?dateTimestamp=${timestamp}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].status).toBe(SESSION_STATUS.AVAILABLE);
      expect(response.body.data[0].teacher.fullName).toBe('Dr. John Watson');
    });

    it('should return 400 if dateTimestamp query is missing', async () => {
      const response = await request(app).get('/sessions/available');
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /sessions/:id/book (Book Session)', () => {
    it('should successfully book an AVAILABLE session and associate with user', async () => {
      const session = await Session.create({
        teacherId,
        startTime: new Date(Date.now() + 3600000),
        endTime: new Date(Date.now() + 7200000),
        status: SESSION_STATUS.AVAILABLE
      });

      const response = await request(app)
        .post(`/sessions/${session._id}/book`)
        .send({ userId });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe(SESSION_STATUS.BOOKED);
      expect(response.body.data.userId).toBe(userId);

      const updated = await Session.findById(session._id);
      expect(updated?.status).toBe(SESSION_STATUS.BOOKED);
      expect(updated?.userId?.toString()).toBe(userId);
    });

    it('should not allow booking a session that is already BOOKED', async () => {
      const session = await Session.create({
        teacherId,
        startTime: new Date(Date.now() + 3600000),
        endTime: new Date(Date.now() + 7200000),
        status: SESSION_STATUS.BOOKED,
        userId
      });

      const anotherUser = await User.create({
        fullName: 'Another User',
        email: 'another@example.com',
        phone: '+1-555-8888'
      });

      const response = await request(app)
        .post(`/sessions/${session._id}/book`)
        .send({ userId: anotherUser._id.toString() });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 404 if user does not exist', async () => {
      const session = await Session.create({
        teacherId,
        startTime: new Date(Date.now() + 3600000),
        endTime: new Date(Date.now() + 7200000),
        status: SESSION_STATUS.AVAILABLE
      });

      const response = await request(app)
        .post(`/sessions/${session._id}/book`)
        .send({ userId: '507f1f77bcf86cd799439011' });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should return 404 if session does not exist', async () => {
      const response = await request(app)
        .post('/sessions/507f1f77bcf86cd799439011/book')
        .send({ userId });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PATCH /sessions/:id/complete (Mark Session Complete)', () => {
    it('should mark a BOOKED session as COMPLETED and set completedAt', async () => {
      const session = await Session.create({
        teacherId,
        userId,
        startTime: new Date(Date.now() - 7200000),
        endTime: new Date(Date.now() - 3600000),
        status: SESSION_STATUS.BOOKED
      });

      const response = await request(app).patch(`/sessions/${session._id}/complete`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe(SESSION_STATUS.COMPLETED);
      expect(response.body.data.completedAt).toBeDefined();

      const updated = await Session.findById(session._id);
      expect(updated?.status).toBe(SESSION_STATUS.COMPLETED);
      expect(updated?.completedAt).not.toBeNull();
    });

    it('should not allow marking an AVAILABLE session as COMPLETED', async () => {
      const session = await Session.create({
        teacherId,
        startTime: new Date(Date.now() + 3600000),
        endTime: new Date(Date.now() + 7200000),
        status: SESSION_STATUS.AVAILABLE
      });

      const response = await request(app).patch(`/sessions/${session._id}/complete`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 404 if session does not exist', async () => {
      const response = await request(app).patch('/sessions/507f1f77bcf86cd799439011/complete');
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });
});
