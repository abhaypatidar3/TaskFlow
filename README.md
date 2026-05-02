# ⚡ TaskFlow — Team Task Manager

A full-stack web application for managing projects and tasks with **role-based access control** (Admin / Member).

**Live URL:** _[Add after Railway deploy]_  
**GitHub:** _[Add repo URL]_

---

## 🚀 Features

- **Authentication** — JWT-based signup/login, persistent sessions
- **Role-Based Access** — Admins have full control; Members can only update their own task status
- **Project Management** — Create, edit, delete projects; add/remove team members
- **Task Tracking** — Create tasks with priority, due dates, status; assign to project members
- **Dashboard** — Role-aware stats: Admins see system-wide metrics; Members see personal task overview
- **Overdue Detection** — Automatically flags tasks past their due date

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js + Express.js |
| Database | MongoDB (Mongoose ODM) |
| Auth | JWT + bcryptjs |
| Frontend | React + Vite (single SPA) |
| Styling | Vanilla CSS (custom dark design system) |
| Deployment | Railway |

---

## 📁 Project Structure

```
Team Task Manager/
├── Backend/
│   ├── src/
│   │   ├── models/       ← User, Project, Task (Mongoose)
│   │   ├── middleware/   ← authMiddleware, requireRole
│   │   ├── routes/       ← auth, users, projects, tasks, dashboard
│   │   ├── controllers/  ← business logic per route group
│   │   └── index.js      ← Express app + MongoDB connect
│   ├── .env.example
│   ├── railway.json
│   └── package.json
└── Frontend/
    ├── src/
    │   ├── api/          ← axios instance + typed endpoint helpers
    │   ├── context/      ← AuthContext (JWT, user state)
    │   ├── guards/       ← ProtectedRoute, RoleGuard
    │   ├── components/   ← Sidebar, Layout
    │   └── pages/        ← Login, Signup, Dashboard, Projects,
    │                        ProjectDetail, AllTasks, MyTasks, Users
    ├── .env.example
    └── package.json
```

---

## ⚙️ Local Setup

### Prerequisites
- Node.js ≥ 18
- MongoDB Atlas account (free tier)

### Backend

```bash
cd Backend
cp .env.example .env
# Fill in MONGODB_URI and JWT_SECRET in .env
npm install
npm run dev       # Starts on http://localhost:3000
```

### Frontend

```bash
cd Frontend
cp .env.example .env
# VITE_API_URL=http://localhost:3000/api (default)
npm install
npm run dev       # Starts on http://localhost:5173
```

---

## 🌐 Railway Deployment

### 1. Deploy Backend
1. Create a new Railway project
2. Add service → connect GitHub repo → set **Root Directory** to `Backend`
3. Set environment variables:
   - `MONGODB_URI` — your MongoDB Atlas connection string
   - `JWT_SECRET` — a strong random secret
   - `FRONTEND_URL` — your deployed frontend URL (for CORS)
   - `NODE_ENV=production`
4. Railway auto-detects Node.js and runs `npm start`

### 2. Deploy Frontend
1. Add another service to the same Railway project → set **Root Directory** to `Frontend`
2. Set environment variable:
   - `VITE_API_URL` — your deployed backend URL + `/api`
3. Build command: `npm run build`
4. Start/Serve command: `npx serve dist` (or configure as static site)

### Notes
- **Never commit `.env` files** — only `.env.example` is committed
- After deploying backend, update `FRONTEND_URL` in backend env vars and redeploy

---

## 🔐 RBAC Summary

| Action | Admin | Member |
|---|---|---|
| Create/Edit/Delete Projects | ✅ | ❌ |
| Manage Project Members | ✅ | ❌ |
| Create/Delete Tasks | ✅ | ❌ |
| Update Any Task Field | ✅ | ❌ |
| Update Own Task Status | ✅ | ✅ |
| View All Users | ✅ | ❌ |
| Change User Roles | ✅ | ❌ |
| View Dashboard | ✅ (system-wide) | ✅ (personal) |

---

## 📹 Demo Video Script (2–5 min)

1. Open the live URL → show Login page
2. Sign up as new user (becomes Member by default)
3. Log in as Admin → show Dashboard with stats
4. Create a project, add the Member user
5. Create 2–3 tasks with different priorities and due dates
6. Log out → log in as Member
7. Show Member dashboard (personal stats)
8. Go to My Tasks → update a task status to In Progress, then Done
9. Back to Admin → show Dashboard reflects updated stats, overdue indicators
10. Show Users page → toggle Member to Admin role

---

## 📄 API Reference

### Auth
- `POST /api/auth/signup` — `{ name, email, password }`
- `POST /api/auth/login` — `{ email, password }` → returns `{ token, user }`
- `GET /api/auth/me` — requires Bearer token

### Projects
- `GET /api/projects` — list (filtered by role)
- `POST /api/projects` — Admin only
- `GET /api/projects/:id`
- `PATCH /api/projects/:id` — Admin only
- `DELETE /api/projects/:id` — Admin only
- `POST /api/projects/:id/members` — `{ userId }`
- `DELETE /api/projects/:id/members/:userId`

### Tasks
- `GET /api/tasks/my` — member's assigned tasks
- `GET /api/tasks` — Admin: all tasks
- `GET /api/tasks/project/:projectId`
- `POST /api/tasks/project/:projectId` — Admin only
- `PATCH /api/tasks/:id` — Admin (full) or Assignee (status only)
- `DELETE /api/tasks/:id` — Admin only

### Dashboard
- `GET /api/dashboard` — role-aware stats

### Users (Admin only)
- `GET /api/users`
- `PATCH /api/users/:id/role` — `{ role: 'ADMIN' | 'MEMBER' }`
- `DELETE /api/users/:id`
