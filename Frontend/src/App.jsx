import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, RoleGuard } from './guards/RouteGuards';

import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import AllTasks from './pages/AllTasks';
import TaskDetail from './pages/TaskDetail';
import MyTasks from './pages/MyTasks';
import Users from './pages/Users';
import Profile from './pages/Profile';
import WorkLogs from './pages/WorkLogs';
import TaskLogs from './pages/TaskLogs';
import UserPerformance from './pages/UserPerformance';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/:id" element={<ProjectDetail />} />
            <Route path="/tasks/:id" element={<TaskDetail />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/my-tasks" element={<MyTasks />} />
            <Route path="/work-logs" element={<WorkLogs />} />
            <Route path="/task-logs" element={<TaskLogs />} />

            <Route element={<RoleGuard role="ADMIN" />}>
              <Route path="/tasks" element={<AllTasks />} />
              <Route path="/users" element={<Users />} />
              <Route path="/users/:id/performance" element={<UserPerformance />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

