import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { taskApi, projectApi } from '../api/endpoints';
import Layout from '../components/Layout';

export default function AllTasks() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', priority: '', project: '' });

  useEffect(() => { projectApi.getAll().then(r => setProjects(r.data.projects)); }, []);
  useEffect(() => {
    setLoading(true);
    taskApi.getAll(filters).then(r => setTasks(r.data.tasks)).finally(() => setLoading(false));
  }, [filters]);

  const isOverdue = (t) => t.dueDate && new Date(t.dueDate) < new Date() && !['CLOSED', 'COMPLETED'].includes(t.status);

  return (
    <Layout title="All Tasks">
      <div className="filters-bar">
        <select className="form-select" value={filters.project} onChange={e => setFilters(f => ({ ...f, project: e.target.value }))}>
          <option value="">All Projects</option>
          {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
        </select>
        <select className="form-select" value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
          <option value="">All Statuses</option><option value="OPEN">Open</option><option value="IN_PROGRESS">In Progress</option><option value="CLOSED">Closed</option><option value="COMPLETED">Completed</option>
        </select>
        <select className="form-select" value={filters.priority} onChange={e => setFilters(f => ({ ...f, priority: e.target.value }))}>
          <option value="">All Priorities</option><option value="HIGH">High</option><option value="MEDIUM">Medium</option><option value="LOW">Low</option>
        </select>
        <span style={{ marginLeft: 'auto', fontSize: '.78rem', color: 'var(--text-muted)' }}>{tasks.length} task{tasks.length !== 1 ? 's' : ''}</span>
      </div>

      {loading ? <div className="page-loading"><div className="spinner" /></div> : (
        tasks.length === 0 ? <div className="empty-state"><p>No tasks found.</p></div> : (
          <div className="table-wrapper">
            <table className="table">
              <thead><tr><th>Task</th><th>Project</th><th>Created By</th><th>Assigned To</th><th>Status</th><th>Priority</th><th>Est.</th><th>Due</th></tr></thead>
              <tbody>
                {tasks.map(t => (
                  <tr key={t._id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/tasks/${t._id}`)}>
                    <td><span style={{ fontWeight: 600 }}>{t.title}</span></td>
                    <td style={{ fontSize: '.8rem' }}>{t.project?.name || '—'}</td>
                    <td style={{ fontSize: '.8rem' }}>{t.creator?.name || '—'}</td>
                    <td style={{ fontSize: '.8rem' }}>{t.assignee?.name || <span style={{ color: 'var(--text-muted)' }}>Unassigned</span>}</td>
                    <td><span className={`badge badge-${t.status?.toLowerCase()}`}>{t.status?.replace('_', ' ')}</span></td>
                    <td><span className={`badge badge-${t.priority?.toLowerCase()}`}>{t.priority}</span></td>
                    <td style={{ fontSize: '.78rem' }}>{t.estimatedHours || 0}h</td>
                    <td className={isOverdue(t) ? 'task-due overdue' : ''} style={{ fontSize: '.78rem' }}>{t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </Layout>
  );
}
