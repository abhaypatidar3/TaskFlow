import './Sidebar.css';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaUser, FaUsers } from 'react-icons/fa';

const Icon = ({ d }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{width:18,height:18}}>
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleNavClick = () => {
    // Close sidebar on mobile after navigation
    if (window.innerWidth <= 768) onClose?.();
  };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  const navLink = (to, iconD, label, IconComponent) => (
    <NavLink
      to={to}
      onClick={handleNavClick}
      className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
    >
      {IconComponent ? <IconComponent size={16} /> : <Icon d={iconD} />}
      {label}
    </NavLink>
  );

  return (
    <aside className={`sidebar${isOpen ? ' sidebar--open' : ''}`}>
      <div className="sidebar-logo">
        <div className="sidebar-logo-inner">
          <div className="sidebar-logo-icon">⚡</div>
          <div>
            <h2>TaskFlow</h2>
            <span>{isAdmin ? 'Admin Panel' : 'Member Panel'}</span>
          </div>
        </div>
        {/* Mobile close button */}
        <button className="sidebar-close-btn" onClick={onClose} aria-label="Close sidebar">
          <CloseIcon />
        </button>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section">Main</div>
        {navLink('/dashboard', 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z', 'Dashboard')}
        {navLink('/projects', 'M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z', 'Projects')}

        {isAdmin ? (
          <>
            <div className="nav-section">Admin</div>
            {navLink('/tasks', 'M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11', 'All Tasks')}
            {navLink('/users', null, 'Users', FaUsers)}
            <div className="nav-section">Analytics</div>
            {navLink('/work-logs', 'M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z', 'Work Logs')}
            {navLink('/task-logs', 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z', 'Task Logs')}
          </>
        ) : (
          <>
            <div className="nav-section">My Work</div>
            {navLink('/my-tasks', 'M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11', 'My Tasks')}
            {navLink('/work-logs', 'M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z', 'Work Logs')}
            {navLink('/task-logs', 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z', 'Task Logs')}
          </>
        )}

        <div className="nav-section">Account</div>
        {navLink('/profile', null, 'Profile', FaUser)}
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
