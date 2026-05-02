import './Dashboard.css';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardApi } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';

export default function Dashboard() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi.get().then(r => setData(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <Layout title="Dashboard"><div className="page-loading"><div className="spinner" /></div></Layout>;
  if (!data) return <Layout title="Dashboard"><div className="empty-state">Failed to load dashboard.</div></Layout>;

  const s = data.stats;
  const isOverdue = (t) => t.dueDate && new Date(t.dueDate) < new Date();

  return (
    <Layout title={`Welcome back, ${user?.name?.split(' ')[0]}`}>
      <div className="stat-grid">
        {isAdmin ? (
          <>
            <div className="stat-card">
              <div className="stat-icon purple">📁</div>
              <div><div className="stat-value">{s.totalProjects}</div><div className="stat-label">Projects</div></div>
            </div>
            <div className="stat-card">
              <div className="stat-icon blue">👥</div>
              <div><div className="stat-value">{s.totalUsers}</div><div className="stat-label">Users</div></div>
            </div>
            <div className="stat-card">
              <div className="stat-icon green">✅</div>
              <div><div className="stat-value">{s.totalTasks}</div><div className="stat-label">Total Tasks</div></div>
            </div>
            <div className="stat-card">
              <div className="stat-icon red">⚠️</div>
              <div><div className="stat-value">{s.overdueCount}</div><div className="stat-label">Overdue</div></div>
            </div>
          </>
        ) : (
          <>
            <div className="stat-card">
              <div className="stat-icon blue">📋</div>
              <div><div className="stat-value">{s.totalAssigned}</div><div className="stat-label">Assigned</div></div>
            </div>
            <div className="stat-card">
              <div className="stat-icon orange">🔄</div>
              <div><div className="stat-value">{s.byStatus?.IN_PROGRESS || 0}</div><div className="stat-label">In Progress</div></div>
            </div>
            <div className="stat-card">
              <div className="stat-icon green">✅</div>
              <div><div className="stat-value">{s.byStatus?.COMPLETED || 0}</div><div className="stat-label">Completed</div></div>
            </div>
            <div className="stat-card">
              <div className="stat-icon red">⚠️</div>
              <div><div className="stat-value">{s.overdueCount}</div><div className="stat-label">Overdue</div></div>
            </div>
          </>
        )}
      </div>

      {/* Status breakdown */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '.9rem', fontWeight: 700, marginBottom: '1rem' }}>Status Overview</h3>
        <div className="status-overview">
          {Object.entries(s.byStatus || {}).map(([key, val]) => (
            <div key={key} className="status-item">
              <div className="status-count">{val}</div>
              <span className={`badge badge-${key.toLowerCase()}`}>{key.replace('_', ' ')}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Overdue tasks */}
      {data.overdueTasks?.length > 0 && (
        <div className="card" style={{ marginBottom: '1.5rem', borderColor: 'rgba(255,85,114,.25)' }}>
          <h3 style={{ fontSize: '.9rem', fontWeight: 700, marginBottom: '.75rem', color: 'var(--danger)' }}>⚠️ Overdue Tasks</h3>
          {data.overdueTasks.map(t => (
            <div key={t._id} className="dash-task-row" onClick={() => navigate(`/tasks/${t._id}`)}>
              <div className="dash-task-left">
                <span className="dash-task-title">{t.title}</span>
                <span style={{ fontSize: '.72rem', color: 'var(--text-muted)', flexShrink: 0 }}>{t.project?.name}</span>
              </div>
              <span className="dash-task-meta" style={{ color: 'var(--danger)' }}>{new Date(t.dueDate).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      )}

      {/* Recent tasks or upcoming */}
      {(data.recentTasks || data.upcomingTasks)?.length > 0 && (
        <div className="card">
          <h3 style={{ fontSize: '.9rem', fontWeight: 700, marginBottom: '.75rem' }}>
            {isAdmin ? 'Recent Tasks' : 'Upcoming Tasks'}
          </h3>
          {(isAdmin ? data.recentTasks : data.upcomingTasks).map(t => (
            <div key={t._id} className="dash-task-row" onClick={() => navigate(`/tasks/${t._id}`)}>
              <div className="dash-task-left">
                <span className={`badge badge-${t.status?.toLowerCase()}`} style={{ fontSize: '.6rem', flexShrink: 0 }}>{t.status?.replace('_', ' ')}</span>
                <span className="dash-task-title">{t.title}</span>
              </div>
              <span className="dash-task-meta">{t.assignee?.name || 'Unassigned'}</span>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
