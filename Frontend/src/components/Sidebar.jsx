import './Sidebar.css';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaUser, FaUsers } from "react-icons/fa";

const Icon = ({ d }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

export default function Sidebar() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const handleLogout = async () => { await logout(); navigate('/login'); };
  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h2>⚡ TaskFlow</h2>
        <span>{isAdmin ? 'Admin Panel' : 'Member Panel'}</span>
      </div>
      <nav className="sidebar-nav">
        <div className="nav-section">Main</div>
        <NavLink to="/dashboard" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
          <Icon d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          Dashboard
        </NavLink>
        <NavLink to="/projects" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
          <Icon d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
          Projects
        </NavLink>

        {isAdmin ? (
          <>
            <div className="nav-section">Admin</div>
            <NavLink to="/tasks" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              <Icon d="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
              All Tasks
            </NavLink>
            <NavLink to="/users" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              <FaUsers size={15} />
              Users
            </NavLink>
            <div className="nav-section">Analytics</div>
            <NavLink to="/work-logs" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              <Icon d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
              Work Logs
            </NavLink>
            <NavLink to="/task-logs" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              <Icon d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              Task Logs
            </NavLink>
          </>
        ) : (
          <>
            <div className="nav-section">My Work</div>
            <NavLink to="/my-tasks" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              <Icon d="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
              My Tasks
            </NavLink>
            <NavLink to="/work-logs" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              <Icon d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
              Work Logs
            </NavLink>
            <NavLink to="/task-logs" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              <Icon d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              Task Logs
            </NavLink>
          </>
        )}

        <div className="nav-section">Account</div>
        <NavLink to="/profile" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
          <FaUser size={15} />
          Profile
        </NavLink>
      </nav>
      <div className="sidebar-footer">
        <div className="user-chip">
          <div className="user-avatar">{initials}</div>
          <div className="user-info">
            <p>{user?.name}</p>
            <span>{user?.role}</span>
          </div>
        </div>
        <button className="logout-btn" onClick={handleLogout}>Sign out</button>
      </div>
    </aside>
  );
}
