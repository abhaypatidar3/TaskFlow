import { useState, useEffect } from 'react';
import './Layout.css';
import Sidebar from './Sidebar';

export default function Layout({ title, actions, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on route change (resize or navigation)
  useEffect(() => {
    const close = () => setSidebarOpen(false);
    window.addEventListener('resize', close);
    return () => window.removeEventListener('resize', close);
  }, []);

  return (
    <div className="app-layout">
      {/* Mobile overlay backdrop */}
      {sidebarOpen && (
        <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />
      )}

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="main-content">
        <div className="topbar">
          <div className="topbar-left">
            {/* Hamburger button (mobile only) */}
            <button
              className="hamburger-btn"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <span /><span /><span />
            </button>
            <h1>{title}</h1>
          </div>
          {actions && <div className="topbar-actions">{actions}</div>}
        </div>
        <div className="page-body">{children}</div>
      </div>
    </div>
  );
}
