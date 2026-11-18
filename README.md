# Teacher Session Booking REST API

A scalable, production-grade REST API backend application built with **Node.js**, **TypeScript**, **Express.js**, **MongoDB**, and **Mongoose**.

The platform enables users to book sessions with teachers:
- Teachers create available time-slot sessions.
- Users can view available sessions filtered by date.
- Users book available sessions.
- Booked sessions can be marked as completed and appear in the user's session history (separated into Upcoming Sessions and Completed Sessions).

---

## Tech Stack

- **Runtime:** Node.js (v18+)
- **Language:** TypeScript
- **Framework:** Express.js
- **Database:** MongoDB & Mongoose ODM
- **Validation:** Zod
- **Testing:** Jest, Supertest, mongodb-memory-server
- **Security & Utilities:** Helmet, CORS, Morgan, dotenv

---

## Architecture & Design

The project is structured according to clean architecture and separation of concerns:

```
teacher-session-booking-api/
├── src/
│   ├── config/             # Environment and MongoDB connection configs
│   ├── constants/          # Application enums and constant definitions
│   ├── controllers/        # Request handling and HTTP status mapping
│   ├── middlewares/        # Centralized error handler, 404, validation
│   ├── models/             # Mongoose schemas and indexes
│   ├── routes/             # Express route declarations
│   ├── services/           # Business logic & Aggregation Pipelines
│   ├── types/              # TypeScript interfaces and type definitions
│   ├── utils/              # ApiError, ApiResponse, asyncHandler
│   ├── validators/         # Zod schemas for input validation
│   ├── app.ts              # Express application factory
│   ├── server.ts           # HTTP server startup & graceful shutdown
│   └── seed.ts             # Database seeding script
├── tests/
│   ├── integration/        # Integration tests for all endpoints
│   └── setup.ts            # MongoMemoryServer in-memory DB lifecycle
├── postman/
│   ├── Teacher_Session_Booking_API.postman_collection.json
│   └── Teacher_Session_Booking_API.postman_environment.json
├── docker-compose.yml
├── Dockerfile
├── package.json
├── tsconfig.json
└── README.md
```

### Key Engineering Highlights
1. **Centralized Error Handling:** Custom `ApiError` class with operational flags, automatic mapping for MongoDB duplicate keys (`E11000`), Mongoose validation/cast errors, and uniform JSON response structures.
2. **MongoDB Aggregation Pipelines:**
   - **Available Sessions (`GET /sessions/available?dateTimestamp={timestamp}`):** Uses `$match` to filter by status and date range, joined with the `teachers` collection via `$lookup`, and projected cleanly.
   - **User Session List (`GET /users/:id/sessions`):** Uses `$match` for the user, `$lookup` to join teacher details, and `$facet` to divide the records into `upcomingSessions` (status: `BOOKED`) and `completedSessions` (status: `COMPLETED`) in a single database round-trip.
3. **Concurrency Control:** Session booking uses atomic `findOneAndUpdate` conditioned on `{ _id: sessionId, status: 'AVAILABLE' }` to prevent race conditions and double-booking.

---

## Database Schemas

### 1. User
| Field | Type | Attributes |
|---|---|---|
| `fullName` | String | required, trim |
| `email` | String | required, unique, lowercase, trim, indexed |
| `phone` | String | required, trim |
| `createdAt` / `updatedAt` | Date | automatic timestamps |

### 2. Teacher
| Field | Type | Attributes |
|---|---|---|
| `fullName` | String | required, trim |
| `email` | String | required, unique, lowercase, trim, indexed |
| `specialization` | String | required, trim |
| `experience` | Number | required, min: 0 |
| `createdAt` / `updatedAt` | Date | automatic timestamps |

### 3. Session
| Field | Type | Attributes |
|---|---|---|
| `teacherId` | ObjectId | ref: Teacher, required, indexed |
| `userId` | ObjectId \| null | ref: User, default: null, indexed |
| `startTime` | Date | required, indexed |
| `endTime` | Date | required |
| `status` | String | enum: `AVAILABLE`, `BOOKED`, `COMPLETED`, default: `AVAILABLE` |
| `completedAt` | Date \| null | default: null |
| `createdAt` / `updatedAt` | Date | automatic timestamps |

---

## API Endpoints

### 1. Create User
- **Endpoint:** `POST /users`
- **Description:** Register a new user with unique email.
- **Request Body:**
```json
{
  "fullName": "John Doe",
  "email": "johndoe@example.com",
  "phone": "+1-9876543210"
}
```
- **Response (201 Created):**
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "_id": "664fa1e2b582098a760c4101",
    "fullName": "John Doe",
    "email": "johndoe@example.com",
    "phone": "+1-9876543210",
    "createdAt": "2026-11-18T10:00:00.000Z",
    "updatedAt": "2026-11-18T10:00:00.000Z"
  }
}
```

---

### 2. Create Teacher (Setup Helper)
- **Endpoint:** `POST /teachers`
- **Request Body:**
```json
{
  "fullName": "Prof. Robert Oppenheimer",
  "email": "oppenheimer@example.com",
  "specialization": "Theoretical Physics",
  "experience": 15
}
```
- **Response (201 Created):** Returns created teacher.

---

### 3. Create Session
- **Endpoint:** `POST /sessions`
- **Description:** Create a new available session for a teacher. Validates that the teacher exists and `endTime > startTime`.
- **Request Body:**
```json
{
  "teacherId": "664fa1e2b582098a760c4202",
  "startTime": "2026-11-19T10:00:00.000Z",
  "endTime": "2026-11-19T11:00:00.000Z"
}
```
- **Response (201 Created):**
```json
{
  "success": true,
  "message": "Session created successfully",
  "data": {
    "_id": "664fa1e2b582098a760c4303",
    "teacherId": "664fa1e2b582098a760c4202",
    "userId": null,
    "startTime": "2026-11-19T10:00:00.000Z",
    "endTime": "2026-11-19T11:00:00.000Z",
    "status": "AVAILABLE",
    "completedAt": null,
    "createdAt": "2026-11-18T10:05:00.000Z",
    "updatedAt": "2026-11-18T10:05:00.000Z"
  }
}
```

---

### 4. Available Sessions for Booking
- **Endpoint:** `GET /sessions/available?dateTimestamp={timestamp}`
- **Description:** Returns all `AVAILABLE` sessions for the provided date.
- **Mandatory Implementation:** MongoDB Aggregation Pipeline with `$match`, `$lookup`, `$unwind`, and `$project`.
- **Query Parameter:** `dateTimestamp` (numeric unix timestamp in ms/s or ISO date string).
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Available sessions retrieved successfully",
  "data": [
    {
      "_id": "664fa1e2b582098a760c4303",
      "teacherId": "664fa1e2b582098a760c4202",
      "teacher": {
        "_id": "664fa1e2b582098a760c4202",
        "fullName": "Prof. Robert Oppenheimer",
        "email": "oppenheimer@example.com",
        "specialization": "Theoretical Physics",
        "experience": 15
      },
      "userId": null,
      "startTime": "2026-11-19T10:00:00.000Z",
      "endTime": "2026-11-19T11:00:00.000Z",
      "status": "AVAILABLE",
      "completedAt": null,
      "createdAt": "2026-11-18T10:05:00.000Z",
      "updatedAt": "2026-11-18T10:05:00.000Z"
    }
  ]
}
```

---

### 5. Book Session
- **Endpoint:** `POST /sessions/:id/book`
- **Description:** Book an existing available session for a user.
- **Rules:**
  - User must exist.
  - Session must exist.
  - Only `AVAILABLE` sessions can be booked.
  - A booked session cannot be booked again.
  - Status updated to `BOOKED` and associated with `userId`.
- **Request Body:**
```json
{
  "userId": "664fa1e2b582098a760c4101"
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Session booked successfully",
  "data": {
    "_id": "664fa1e2b582098a760c4303",
    "teacherId": "664fa1e2b582098a760c4202",
    "userId": "664fa1e2b582098a760c4101",
    "startTime": "2026-11-19T10:00:00.000Z",
    "endTime": "2026-11-19T11:00:00.000Z",
    "status": "BOOKED",
    "completedAt": null,
    "createdAt": "2026-11-18T10:05:00.000Z",
    "updatedAt": "2026-11-18T10:10:00.000Z"
  }
}
```

---

### 6. Mark Session Complete
- **Endpoint:** `PATCH /sessions/:id/complete`
- **Description:** Mark a booked session as complete.
- **Rules:**
  - Session must exist.
  - Only `BOOKED` sessions can be marked as completed.
  - Status updated to `COMPLETED` and `completedAt` timestamp is set.
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Session marked as completed successfully",
  "data": {
    "_id": "664fa1e2b582098a760c4303",
    "teacherId": "664fa1e2b582098a760c4202",
    "userId": "664fa1e2b582098a760c4101",
    "startTime": "2026-11-19T10:00:00.000Z",
    "endTime": "2026-11-19T11:00:00.000Z",
    "status": "COMPLETED",
    "completedAt": "2026-11-18T11:00:00.000Z",
    "createdAt": "2026-11-18T10:05:00.000Z",
    "updatedAt": "2026-11-18T11:00:00.000Z"
  }
}
```

---

### 7. User Session List
- **Endpoint:** `GET /users/:id/sessions`
- **Description:** Return all sessions for the specified user separated into `upcomingSessions` and `completedSessions`.
- **Mandatory Implementation:** MongoDB Aggregation Pipeline utilizing `$facet` for dual categorized output in a single query.
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "User sessions retrieved successfully",
  "data": {
    "upcomingSessions": [
      {
        "_id": "664fa1e2b582098a760c4303",
        "userId": "664fa1e2b582098a760c4101",
        "teacherId": "664fa1e2b582098a760c4202",
        "teacher": {
          "_id": "664fa1e2b582098a760c4202",
          "fullName": "Prof. Robert Oppenheimer",
          "email": "oppenheimer@example.com",
          "specialization": "Theoretical Physics"
        },
        "startTime": "2026-11-19T10:00:00.000Z",
        "endTime": "2026-11-19T11:00:00.000Z",
        "status": "BOOKED",
        "completedAt": null,
        "createdAt": "2026-11-18T10:05:00.000Z",
        "updatedAt": "2026-11-18T10:10:00.000Z"
      }
    ],
    "completedSessions": [
      {
        "_id": "664fa1e2b582098a760c4304",
        "userId": "664fa1e2b582098a760c4101",
        "teacherId": "664fa1e2b582098a760c4202",
        "teacher": {
          "_id": "664fa1e2b582098a760c4202",
          "fullName": "Prof. Robert Oppenheimer",
          "email": "oppenheimer@example.com",
          "specialization": "Theoretical Physics"
        },
        "startTime": "2026-11-17T09:00:00.000Z",
        "endTime": "2026-11-17T10:00:00.000Z",
        "status": "COMPLETED",
        "completedAt": "2026-11-17T10:00:00.000Z",
        "createdAt": "2026-11-17T08:00:00.000Z",
        "updatedAt": "2026-11-17T10:00:00.000Z"
      }
    ]
  }
}
```

---

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MongoDB instance (local or MongoDB Atlas connection string)
- npm or pnpm or yarn

### 1. Installation
Clone the repository and install dependencies:
```bash
git clone <repository_url>
cd teacher-session-booking-api
npm install
```

### 2. Environment Setup
Copy the sample environment configuration:
```bash
cp .env.example .env
```
Edit `.env` if necessary:
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/teacher_booking_db
CORS_ORIGIN=*
```

### 3. Seed Sample Data (Optional but Recommended)
Populate the database with sample teachers, users, and sessions across all statuses:
```bash
npm run seed
```

### 4. Running the Application
- **Development Mode (with auto-reload):**
  ```bash
  npm run dev
  ```
- **Production Build:**
  ```bash
  npm run build
  npm start
  ```

---

## Running with Docker

Run the API and MongoDB together using Docker Compose:
```bash
docker-compose up --build
```
The API will be available at `http://localhost:5000`.

---

## Running Tests

Integration tests run using an in-memory MongoDB (`mongodb-memory-server`), requiring no external database:
```bash
npm test
```

---

## Testing with Postman

1. Open Postman.
2. Click **Import** and select:
   - `postman/Teacher_Session_Booking_API.postman_collection.json`
   - `postman/Teacher_Session_Booking_API.postman_environment.json`
3. Select the **Teacher Session Booking - Local** environment.
4. Run the requests in order:
   - **0. Create Teacher**: Automatically captures `teacherId`.
   - **API 1 - Create User**: Automatically captures `userId`.
   - **API 2 - Create Session**: Automatically creates an available session for tomorrow and captures `sessionId`.
   - **API 3 - Available Sessions for Booking**: Fetches available sessions for the session date.
   - **API 4 - Book Session**: Books the session for the created user.
   - **API 5 - Mark Session Complete**: Marks the session completed.
   - **API 6 - User Session List**: Retrieves the user's upcoming and completed sessions.

---

## License
MIT
