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
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
          {Object.entries(s.byStatus || {}).map(([key, val]) => (
            <div key={key} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{val}</div>
              <span className={`badge badge-${key.toLowerCase()}`}>{key.replace('_', ' ')}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Overdue tasks */}
      {data.overdueTasks?.length > 0 && (
        <div className="card" style={{ marginBottom: '1.5rem', borderColor: 'rgba(239,68,68,.25)' }}>
          <h3 style={{ fontSize: '.9rem', fontWeight: 700, marginBottom: '.75rem', color: 'var(--danger)' }}>⚠️ Overdue Tasks</h3>
          {data.overdueTasks.map(t => (
            <div key={t._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '.5rem 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }} onClick={() => navigate(`/tasks/${t._id}`)}>
              <div>
                <span style={{ fontWeight: 600, fontSize: '.85rem' }}>{t.title}</span>
                <span style={{ marginLeft: '.5rem', fontSize: '.72rem', color: 'var(--text-muted)' }}>{t.project?.name}</span>
              </div>
              <span style={{ fontSize: '.72rem', color: 'var(--danger)' }}>{new Date(t.dueDate).toLocaleDateString()}</span>
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
            <div key={t._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '.5rem 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }} onClick={() => navigate(`/tasks/${t._id}`)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                <span className={`badge badge-${t.status?.toLowerCase()}`} style={{ fontSize: '.6rem' }}>{t.status?.replace('_', ' ')}</span>
                <span style={{ fontWeight: 500, fontSize: '.85rem' }}>{t.title}</span>
              </div>
              <span style={{ fontSize: '.72rem', color: 'var(--text-muted)' }}>{t.assignee?.name || 'Unassigned'}</span>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
