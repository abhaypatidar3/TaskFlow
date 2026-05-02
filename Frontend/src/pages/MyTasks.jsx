import './TaskCard.css';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { taskApi } from '../api/endpoints';
import Layout from '../components/Layout';

export default function MyTasks() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', priority: '' });

  useEffect(() => {
    setLoading(true);
    taskApi.getMy(filters).then(r => setTasks(r.data.tasks)).finally(() => setLoading(false));
  }, [filters]);

  const isOverdue = (t) => t.dueDate && new Date(t.dueDate) < new Date() && !['CLOSED', 'COMPLETED'].includes(t.status);

  return (
    <Layout title="My Tasks">
      <div className="filters-bar">
        <select className="form-select" value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
          <option value="">All Statuses</option><option value="OPEN">Open</option><option value="IN_PROGRESS">In Progress</option><option value="CLOSED">Closed</option><option value="COMPLETED">Completed</option>
        </select>
        <select className="form-select" value={filters.priority} onChange={e => setFilters(f => ({ ...f, priority: e.target.value }))}>
          <option value="">All Priorities</option><option value="HIGH">High</option><option value="MEDIUM">Medium</option><option value="LOW">Low</option>
        </select>
        <span style={{ marginLeft: 'auto', fontSize: '.78rem', color: 'var(--text-muted)' }}>{tasks.length} task{tasks.length !== 1 ? 's' : ''}</span>
      </div>

      {loading ? <div className="page-loading"><div className="spinner" /></div> : (
        tasks.length === 0 ? <div className="empty-state"><p>No tasks assigned to you yet.</p></div> : (
          <div className="grid-3">
            {tasks.map(t => (
              <div key={t._id} className={`task-card ${t.priority?.toLowerCase()}`} onClick={() => navigate(`/tasks/${t._id}`)}>
                <div className="task-card-header"><span className="task-card-title">{t.title}</span></div>
                <div className="task-card-meta">
                  <span className={`badge badge-${t.status?.toLowerCase()}`}>{t.status?.replace('_', ' ')}</span>
                  <span className={`badge badge-${t.priority?.toLowerCase()}`}>{t.priority}</span>
                  {t.estimatedHours > 0 && <span style={{ fontSize: '.68rem', color: 'var(--text-muted)' }}>⏱ {t.estimatedHours}h</span>}
                </div>
                <div className="task-card-meta" style={{ marginTop: '.4rem' }}>
                  <span style={{ fontSize: '.72rem', color: 'var(--text-secondary)' }}>📁 {t.project?.name}</span>
                  {t.dueDate && <span className={`task-due ${isOverdue(t) ? 'overdue' : ''}`}>📅 {new Date(t.dueDate).toLocaleDateString()}</span>}
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </Layout>
  );
}
