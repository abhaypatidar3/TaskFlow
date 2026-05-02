import './TaskCard.css';
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectApi, taskApi } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';

function TaskModal({ projectId, members, onClose, onSave }) {
  const [form, setForm] = useState({ title: '', description: '', priority: 'MEDIUM', dueDate: '', assigneeId: '', estimatedHours: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try { await taskApi.create(projectId, form); onSave(); }
    catch (err) { setError(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Failed.'); setLoading(false); }
  };
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-lg">
        <div className="modal-header"><h3>Create Task</h3><button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button></div>
        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input className="form-input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select className="form-select" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                <option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Assignee</label>
              <select className="form-select" value={form.assigneeId} onChange={e => setForm(f => ({ ...f, assigneeId: e.target.value }))}>
                <option value="">Unassigned</option>
                {members.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Due Date</label>
              <input type="date" className="form-input" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Estimated Hours</label>
              <input type="number" className="form-input" min="0" step="0.5" value={form.estimatedHours} onChange={e => setForm(f => ({ ...f, estimatedHours: e.target.value }))} placeholder="e.g. 8" />
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Creating...' : 'Create Task'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [filters, setFilters] = useState({ status: '', priority: '' });

  const load = async () => {
    setLoading(true);
    try {
      const [pRes, tRes] = await Promise.all([projectApi.getById(id), taskApi.getByProject(id, filters)]);
      setProject(pRes.data.project); setTasks(tRes.data.tasks);
    } catch { navigate('/projects'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [id, filters]);

  if (loading) return <Layout title="Loading..."><div className="page-loading"><div className="spinner" /></div></Layout>;
  if (!project) return null;

  const isOverdue = (t) => t.dueDate && new Date(t.dueDate) < new Date() && !['CLOSED', 'COMPLETED'].includes(t.status);
  const handleDelete = async (taskId) => {
    if (!confirm('Delete this task?')) return;
    try { await taskApi.delete(taskId); load(); } catch (e) { alert(e.response?.data?.message); }
  };

  return (
    <Layout title={project.name} actions={
      <div style={{ display: 'flex', gap: '.5rem' }}>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/projects')}>← Back</button>
        {isAdmin && <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>+ Create Task</button>}
      </div>
    }>
      {showCreate && <TaskModal projectId={id} members={project.members} onClose={() => setShowCreate(false)} onSave={() => { setShowCreate(false); load(); }} />}

      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '.85rem' }}>{project.description || 'No description.'}</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '.72rem', marginTop: '.4rem' }}>Owner: {project.owner?.name}</p>
          </div>
          <div className="project-members">
            <div className="member-avatars">{project.members.map(m => <div key={m._id} className="member-avatar" title={m.name}>{m.name.charAt(0).toUpperCase()}</div>)}</div>
            <span style={{ fontSize: '.72rem', color: 'var(--text-secondary)' }}>{project.members.length} members</span>
          </div>
        </div>
      </div>

      <div className="filters-bar">
        <select className="form-select" value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
          <option value="">All Statuses</option><option value="OPEN">Open</option><option value="IN_PROGRESS">In Progress</option><option value="CLOSED">Closed</option><option value="COMPLETED">Completed</option>
        </select>
        <select className="form-select" value={filters.priority} onChange={e => setFilters(f => ({ ...f, priority: e.target.value }))}>
          <option value="">All Priorities</option><option value="HIGH">High</option><option value="MEDIUM">Medium</option><option value="LOW">Low</option>
        </select>
        <span style={{ marginLeft: 'auto', fontSize: '.78rem', color: 'var(--text-muted)' }}>{tasks.length} task{tasks.length !== 1 ? 's' : ''}</span>
      </div>

      {tasks.length === 0 ? <div className="empty-state"><p>No tasks found.</p></div> : (
        <div className="grid-3">
          {tasks.map(t => (
            <div key={t._id} className={`task-card ${t.priority?.toLowerCase()}`} onClick={() => navigate(`/tasks/${t._id}`)}>
              <div className="task-card-header">
                <span className="task-card-title">{t.title}</span>
                {isAdmin && <div style={{ display: 'flex', gap: '.15rem' }} onClick={e => e.stopPropagation()}>
                  <button className="btn btn-ghost btn-icon" style={{ fontSize: '.75rem' }} onClick={() => handleDelete(t._id)}>🗑️</button>
                </div>}
              </div>
              <div className="task-card-meta">
                <span className={`badge badge-${t.status?.toLowerCase()}`}>{t.status?.replace('_', ' ')}</span>
                <span className={`badge badge-${t.priority?.toLowerCase()}`}>{t.priority}</span>
                {t.estimatedHours > 0 && <span style={{ fontSize: '.68rem', color: 'var(--text-muted)' }}>⏱ {t.estimatedHours}h est</span>}
              </div>
              <div className="task-card-meta" style={{ marginTop: '.4rem' }}>
                <span className="task-assignee">👤 {t.assignee?.name || 'Unassigned'}</span>
                {t.dueDate && <span className={`task-due ${isOverdue(t) ? 'overdue' : ''}`}>📅 {new Date(t.dueDate).toLocaleDateString()}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
