import './Profile.css';
import './Dashboard.css';
import { useEffect, useState } from 'react';
import { taskApi } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';

export default function Profile() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (user?.role === 'MEMBER') {
      taskApi.getMy({}).then(r => {
        const tasks = r.data.tasks;
        setStats({
          total: tasks.length,
          open: tasks.filter(t => t.status === 'OPEN').length,
          inProgress: tasks.filter(t => t.status === 'IN_PROGRESS').length,
          completed: tasks.filter(t => t.status === 'COMPLETED').length,
          closed: tasks.filter(t => t.status === 'CLOSED').length,
        });
      });
    }
  }, [user]);

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  return (
    <Layout title="Profile">
      <div className="card profile-card">
        <div className="profile-header">
          <div className="profile-avatar">{initials}</div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{user?.name}</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '.85rem' }}>{user?.email}</p>
            <span className={`badge badge-${user?.role?.toLowerCase()}`} style={{ marginTop: '.35rem' }}>{user?.role}</span>
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
          <div className="info-row"><span className="info-label">Full Name</span><span className="info-value">{user?.name}</span></div>
          <div className="info-row"><span className="info-label">Email</span><span className="info-value">{user?.email}</span></div>
          <div className="info-row"><span className="info-label">Role</span><span className="info-value">{user?.role}</span></div>
          <div className="info-row"><span className="info-label">Joined</span><span className="info-value">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}</span></div>
        </div>
      </div>

      {stats && (
        <div style={{ marginTop: '1.5rem' }}>
          <h3 style={{ fontSize: '.95rem', fontWeight: 700, marginBottom: '1rem' }}>My Task Summary</h3>
          <div className="stat-grid">
            <div className="stat-card"><div className="stat-icon blue">📋</div><div><div className="stat-value">{stats.total}</div><div className="stat-label">Total Assigned</div></div></div>
            <div className="stat-card"><div className="stat-icon orange">🔄</div><div><div className="stat-value">{stats.inProgress}</div><div className="stat-label">In Progress</div></div></div>
            <div className="stat-card"><div className="stat-icon green">✅</div><div><div className="stat-value">{stats.completed}</div><div className="stat-label">Completed</div></div></div>
            <div className="stat-card"><div className="stat-icon red">🔒</div><div><div className="stat-value">{stats.closed}</div><div className="stat-label">Closed</div></div></div>
          </div>
        </div>
      )}
    </Layout>
  );
}
