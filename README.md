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

