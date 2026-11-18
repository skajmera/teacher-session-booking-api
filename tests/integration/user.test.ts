import request from 'supertest';
import { createApp } from '../../src/app';
import { User } from '../../src/models/user.model';
import { Teacher } from '../../src/models/teacher.model';
import { Session } from '../../src/models/session.model';
import { SESSION_STATUS } from '../../src/constants/session.constant';

const app = createApp();

describe('User Endpoints', () => {
  describe('POST /users', () => {
    it('should create a new user with valid data', async () => {
      const response = await request(app)
        .post('/users')
        .send({
          fullName: 'Alice Johnson',
          email: 'alice@example.com',
          phone: '+1-234-567-8901'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('_id');
      expect(response.body.data.email).toBe('alice@example.com');
      expect(response.body.data.fullName).toBe('Alice Johnson');

      const savedUser = await User.findOne({ email: 'alice@example.com' });
      expect(savedUser).not.toBeNull();
    });

    it('should return 409 if email is already registered', async () => {
      await User.create({
        fullName: 'Existing User',
        email: 'alice@example.com',
        phone: '+1-111-222-3333'
      });

      const response = await request(app)
        .post('/users')
        .send({
          fullName: 'Alice Clone',
          email: 'alice@example.com',
          phone: '+1-234-567-8901'
        });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 if validation fails', async () => {
      const response = await request(app)
        .post('/users')
        .send({
          fullName: 'A',
          email: 'not-an-email',
          phone: '123'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('GET /users/:id/sessions', () => {
    it('should return separated upcoming and completed sessions using aggregation', async () => {
      const user = await User.create({
        fullName: 'Bob Smith',
        email: 'bob@example.com',
        phone: '+1-555-4444'
      });

      const teacher = await Teacher.create({
        fullName: 'Dr. Jane Watson',
        email: 'jane.watson@example.com',
        specialization: 'Physics',
        experience: 5
      });

      const now = new Date();
      const upcomingStart = new Date(now.getTime() + 86400000);
      const upcomingEnd = new Date(upcomingStart.getTime() + 3600000);

      const pastStart = new Date(now.getTime() - 86400000);
      const pastEnd = new Date(pastStart.getTime() + 3600000);

      await Session.create([
        {
          teacherId: teacher._id,
          userId: user._id,
          startTime: upcomingStart,
          endTime: upcomingEnd,
          status: SESSION_STATUS.BOOKED,
          completedAt: null
        },
        {
          teacherId: teacher._id,
          userId: user._id,
          startTime: pastStart,
          endTime: pastEnd,
          status: SESSION_STATUS.COMPLETED,
          completedAt: pastEnd
        }
      ]);

      const response = await request(app).get(`/users/${user._id}/sessions`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('upcomingSessions');
      expect(response.body.data).toHaveProperty('completedSessions');
      expect(response.body.data.upcomingSessions).toHaveLength(1);
      expect(response.body.data.completedSessions).toHaveLength(1);
      expect(response.body.data.upcomingSessions[0].teacher.fullName).toBe('Dr. Jane Watson');
      expect(response.body.data.completedSessions[0].status).toBe('COMPLETED');
    });

    it('should return 404 if user does not exist', async () => {
      const response = await request(app).get('/users/507f1f77bcf86cd799439011/sessions');
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid user id format', async () => {
      const response = await request(app).get('/users/invalid-id/sessions');
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
});
