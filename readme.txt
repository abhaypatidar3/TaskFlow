TaskFlow - Team Task Manager
============================

Hey there! This is TaskFlow, a full-stack project and task management application I built from scratch. It was originally developed as an assignment for ethara.ai.

The goal was to build a complete end-to-end task manager that actually feels good to use, with a solid focus on role-based access, time tracking, and performance analytics.

Features
--------
- Role-Based Access Control (RBAC): Admins can create projects, assign tasks, and view team analytics. Members get a focused view of their assigned work.
- Live Time Tracking: Built-in start/stop timers on tasks so you don't have to guess how long something took.
- Work Logs & Heatmaps: A LeetCode-style contribution graph to visualize team activity and productivity over time.
- Fully Responsive UI: Works just as well on your phone as it does on a desktop. Features a modern dark theme with vibrant accents.
- Comments & Activity Log: Every status change, assignment, or comment is tracked to keep a full audit trail.

Tech Stack
----------
- Frontend: React 19, Vite, custom responsive CSS (built without heavy UI frameworks for maximum control)
- Backend: Node.js, Express.js
- Database: MongoDB with Mongoose
- Authentication: JWT via HttpOnly cookies

API Architecture

The backend is designed as a RESTful API that communicates with the frontend client. The structure focuses on clarity, scalability, and maintainability.

--Resource-based routing: Endpoints follow a consistent pattern such as /api/projects, /api/tasks, and /api/users, making the API predictable and easy to work with.
--Middleware handling: Dedicated middleware is used for authentication and authorization. For example, JWT verification is handled in auth.middleware.js, and additional checks ensure that only ADMIN users can access certain routes.
--Data validation: Incoming requests are validated before interacting with the database. This helps prevent invalid data from being stored and reduces potential errors early in the process.
--Centralized error handling: Errors are managed through a common wrapper, so responses remain consistent across the API and are easier to debug.
--Separation of concerns: The codebase is organized so that routes call controllers, and controllers handle the business logic while interacting with Mongoose models. This keeps the structure clean and easier to maintain or extend.

How to run it locally
---------------------
You'll need Node.js installed and access to a MongoDB database.

1. Backend Setup:
   - cd backend
   - Create a .env file (you'll need MONGO_URI, JWT_SECRET, and PORT=3000)
   - npm install
   - npm run dev

2. Frontend Setup:
   - Open a new terminal
   - cd frontend
   - Create a .env file (VITE_API_URL=http://localhost:3000/api)
   - npm install
   - npm run dev

3. Open http://localhost:5173 in your browser.

Note: By default, new signups are given the 'MEMBER' role. Since there's no open registration for Admins (for security), you'll need to manually change your first user's role to 'ADMIN' directly in your MongoDB database to access the admin dashboards and create projects.

---
Built by Abhay Patidar (github.com/abhaypatidar3)

Credentials:
Admin: admin@taskflow.com
password: admin@1234

user: abhay@gmail.com
password: abhay9784

Deployed Links: 
Frontend: https://taskflow-ethara.up.railway.app
Backend: https://taskflow-production-4473.up.railway.app

