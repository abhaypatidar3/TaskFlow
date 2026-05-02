import './Layout.css';
import Sidebar from './Sidebar';

export default function Layout({ title, actions, children }) {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <div className="topbar">
          <h1>{title}</h1>
          {actions && <div className="topbar-actions">{actions}</div>}
        </div>
        <div className="page-body">{children}</div>
      </div>
    </div>
  );
}
